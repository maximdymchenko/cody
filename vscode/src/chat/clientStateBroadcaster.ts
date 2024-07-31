import {
    type ContextItem,
    ContextItemSource,
    type ContextItemTree,
    contextFiltersProvider,
    displayLineRange,
    displayPathBasename,
    expandToLineRange,
    openCtx,
} from '@sourcegraph/cody-shared'
import * as vscode from 'vscode'
import { getAncestorProjectRootDir } from '../commands/context/project'
import { getSelectionOrFileContext } from '../commands/context/selection'
import { toVSCodeRange } from '../common/range'
import { createRemoteRepositoryMention } from '../context/openctx/remoteRepositorySearch'
import type { RemoteSearch } from '../context/remote-search'
import type { ChatModel } from './chat-view/ChatModel'
import { contextItemMentionFromOpenCtxItem } from './context/chatContext'
import type { ExtensionMessage } from './protocol'

type PostMessage = (message: Extract<ExtensionMessage, { type: 'clientState' }>) => void

const USE_DIRECTORY_INITIAL_CONTEXT = true

/**
 * Listen for changes to the client (such as VS Code) state to send to the webview.
 */
export function startClientStateBroadcaster({
    remoteSearch,
    postMessage: rawPostMessage,
    chatModel,
}: {
    remoteSearch: RemoteSearch | null
    postMessage: PostMessage
    chatModel: ChatModel
}): vscode.Disposable {
    const postMessage = idempotentPostMessage(rawPostMessage)

    async function rawSendClientState(signal: AbortSignal | null): Promise<void> {
        const items: ContextItem[] = []

        // TODO(sqs): Make this consistent between self-serve (no remote search) and enterprise (has
        // remote search).
        if (remoteSearch) {
            // TODO(sqs): Track the last-used repositories. Right now it just uses the current
            // repository.
            //
            // Make a repository item that is the same as what the @-repository OpenCtx provider
            // would return.
            const repos = remoteSearch.getRepos('all')
            for (const repo of repos) {
                if (contextFiltersProvider.isRepoNameIgnored(repo.name)) {
                    continue
                }

                // TODO!(sqs): add remote repo support for monorepo dirs
                const item: ContextItem = {
                    ...contextItemMentionFromOpenCtxItem(
                        createRemoteRepositoryMention({
                            id: repo.id,
                            name: repo.name,
                            url: repo.name,
                        })
                    ),
                    title: 'Repository',
                    description: repo.name,
                    source: ContextItemSource.Initial,
                    icon: 'folder',
                }
                items.push(item)
            }
        } else {
            // TODO(sqs): Support multi-root. Right now, this only supports the 1st workspace root.
            if (USE_DIRECTORY_INITIAL_CONTEXT) {
                const item = await getAncestorProjectRootDir(signal ?? undefined)
                if (item) {
                    item.source = ContextItemSource.Initial
                    item.icon = 'folder'
                    item.title = 'Project'
                    items.push(item)
                }
            } else {
                const workspaceFolder = vscode.workspace.workspaceFolders?.at(0)
                if (workspaceFolder) {
                    const item = {
                        type: 'tree',
                        uri: workspaceFolder.uri,
                        title: 'Repository',
                        name: workspaceFolder.name,
                        description: workspaceFolder.name,
                        isWorkspaceRoot: true,
                        workspaceFolder: workspaceFolder.uri,
                        content: null,
                        source: ContextItemSource.Initial,
                        icon: 'folder',
                    } satisfies ContextItemTree

                    items.push(item)
                }
            }
        }

        const { input, context } = chatModel.contextWindow
        const userContextSize = context?.user ?? input

        const [contextFile] = await getSelectionOrFileContext()
        signal?.throwIfAborted()
        if (contextFile) {
            const range = contextFile.range ? expandToLineRange(contextFile.range) : undefined
            const item = {
                ...contextFile,
                type: 'file',
                title: range ? 'Current Selection' : 'Current File',
                description: `${displayPathBasename(contextFile.uri)}${
                    range ? `:${displayLineRange(range)}` : ''
                }`,
                range,
                isTooLarge: contextFile.size !== undefined && contextFile.size > userContextSize,
                source: ContextItemSource.Initial,
                icon: range ? 'list-selection' : 'file',
            } satisfies ContextItem

            items.push(item)
        }

        // Get OpenCtx annotations that are in the selection range.
        if (openCtx.client) {
            const selectionRange = toVSCodeRange(contextFile.range)
            const doc = await vscode.workspace.openTextDocument(contextFile.uri)
            const anns = await openCtx.client.annotations(doc)
            for (const ann of anns) {
                if (selectionRange && ann.range && !selectionRange.intersection(ann.range)) {
                    continue
                }
                items.push({
                    type: 'openctx',
                    provider: 'openctx',
                    title: ann.item.title,
                    uri: vscode.Uri.parse(
                        `${ann.uri}/annotation?${encodeURIComponent(ann.item.url ?? '')}`
                    ), // TODO!(sqs): encoding
                    providerUri: ann.providerUri,
                    mention: {
                        uri: ann.uri,
                        data: ann.item,
                        description:
                            ann.item.ui?.hover?.markdown ?? ann.item.ui?.hover?.text ?? undefined,
                    },
                    content: ann.item.url, // TODO!(sqs): ann.item.ai?.content,
                    source: ContextItemSource.Initial,
                })
            }
        }

        postMessage({ type: 'clientState', value: { initialContext: items } })
    }

    const disposables: vscode.Disposable[] = []

    const sendClientState = debounced(rawSendClientState)
    disposables.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            // Relatively infrequent action, so don't debounce and show immediately in the UI.
            //
            // Here and in other invocations with 'immediate' still need to go through the debounced
            // function and should not call rawSendClientState directly to avoid a race condition
            // where a slow earlier call to rawSendClientState could call postMessage with stale
            // data.
            void sendClientState('immediate')
        }),
        vscode.window.onDidChangeTextEditorSelection(e => {
            // Frequent action, so debounce.
            void sendClientState('debounce')
        }),
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            // Infrequent action, so don't debounce and show immediately in the UI.
            void sendClientState('immediate')
        })
    )
    if (remoteSearch) {
        disposables.push(
            remoteSearch.onDidChangeStatus(() => {
                // Background action, so it's fine to debounce.
                void sendClientState('debounce')
            })
        )
    }

    // Don't debounce for the first invocation so we immediately reflect the state in the UI.
    void sendClientState('immediate')

    return vscode.Disposable.from(...disposables)
}

function idempotentPostMessage(rawPostMessage: PostMessage): PostMessage {
    let lastMessage: Parameters<typeof rawPostMessage>[0] | undefined
    const idempotentPostMessage: PostMessage = message => {
        const changed =
            lastMessage === undefined || JSON.stringify(message) !== JSON.stringify(lastMessage)
        if (changed) {
            lastMessage = message
            rawPostMessage(message)
        }
    }
    return idempotentPostMessage
}

function debounced(
    fn: (signal: AbortSignal) => Promise<void>
): (behavior: 'debounce' | 'immediate') => Promise<void> {
    // We can't just use lodash's debounce because we need to pass the `fn` an AbortSignal so it
    // knows when it has been canceled.

    const DEBOUNCE_DELAY = 200
    let timeoutId: NodeJS.Timeout | number | undefined = undefined
    let abortController: AbortController | undefined = undefined

    return async (behavior: 'debounce' | 'immediate'): Promise<void> => {
        if (timeoutId) {
            clearTimeout(timeoutId)
            if (abortController) {
                abortController.abort()
                abortController = undefined
            }
        }

        abortController = new AbortController()
        const signal = abortController.signal

        timeoutId = setTimeout(
            async () => {
                timeoutId = undefined
                try {
                    await fn(signal)
                } catch (error) {
                    if (error && (error as any).name !== 'AbortError') {
                        console.error('debounced function execution failed:', error)
                    }
                }
            },
            behavior === 'debounce' ? DEBOUNCE_DELAY : 0
        )
    }
}
