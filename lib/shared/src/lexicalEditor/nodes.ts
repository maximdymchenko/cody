import type { SerializedLexicalNode, SerializedTextNode, Spread } from 'lexical'
import { URI } from 'vscode-uri'
import type {
    ContextItem,
    ContextItemFile,
    ContextItemOpenCtx,
    ContextItemRepository,
    ContextItemSource,
    ContextItemSymbol,
    ContextItemTree,
} from '../codebase-context/messages'
import { displayLineRange } from '../common/range'
import { displayPathBasename } from '../editor/displayPath'

/** Old-style mention text. */
export const CONTEXT_ITEM_MENTION_TEXT_NODE_TYPE = 'contextItemMention'

/** New-style mention "chip". */
export const CONTEXT_ITEM_MENTION_CHIP_NODE_TYPE = 'mention'

/**
 * The subset of {@link ContextItem} fields that we need to store to identify and display context
 * item mentions.
 */
export type SerializedContextItem = {
    uri: string
    title?: string
    content?: undefined
    source?: ContextItemSource
} & (
    | Omit<ContextItemFile, 'uri' | 'content' | 'source'>
    | Omit<ContextItemRepository, 'uri' | 'content' | 'source'>
    | Omit<ContextItemTree, 'uri' | 'content' | 'source'>
    | Omit<ContextItemSymbol, 'uri' | 'content' | 'source'>
    | Omit<ContextItemOpenCtx, 'uri' | 'content' | 'source'>
)

export type SerializedContextItemMentionNode = Spread<
    {
        type: typeof CONTEXT_ITEM_MENTION_CHIP_NODE_TYPE
        contextItem: SerializedContextItem
        isFromInitialContext: boolean
        text: string
    },
    SerializedLexicalNode
>

export type SerializedContextItemMentionTextNode = Spread<
    {
        type: typeof CONTEXT_ITEM_MENTION_TEXT_NODE_TYPE
        contextItem: SerializedContextItem
        isFromInitialContext: boolean
    },
    SerializedTextNode
>

export function serializeContextItem(
    contextItem: ContextItem | SerializedContextItem
): SerializedContextItem {
    // Make sure we only bring over the fields on the context item that we need, or else we
    // could accidentally include tons of data (including the entire contents of files).
    return {
        ...contextItem,
        uri: contextItem.uri.toString(),

        // Don't include the `content` (if it's present) because it's quite large, and we don't need
        // to serialize it here. It can be hydrated on demand.
        content: undefined,
    }
}

export function deserializeContextItem(contextItem: SerializedContextItem): ContextItem {
    return { ...contextItem, uri: URI.parse(contextItem.uri) } as ContextItem
}

export function isSerializedContextItemMentionNode(
    node: SerializedLexicalNode | null | undefined
): node is SerializedContextItemMentionTextNode {
    return Boolean(node && node.type === CONTEXT_ITEM_MENTION_TEXT_NODE_TYPE)
}

export function contextItemMentionNodeDisplayText(contextItem: SerializedContextItem): string {
    // A displayed range of `foo.txt:2-4` means "include all of lines 2, 3, and 4", which means the
    // range needs to go to the start (0th character) of line 5. Also, `RangeData` is 0-indexed but
    // display ranges are 1-indexed.
    const rangeText = contextItem.range?.start ? `:${displayLineRange(contextItem.range)}` : ''
    switch (contextItem.type) {
        case 'file':
            if (contextItem.provider && contextItem.title) {
                return contextItem.title
            }
            return `${decodeURIComponent(displayPathBasename(URI.parse(contextItem.uri)))}${rangeText}`

        case 'repository':
            return trimCommonRepoNamePrefixes(contextItem.repoName) ?? 'unknown repository'

        case 'tree':
            return contextItem.name ?? 'unknown folder'

        case 'symbol':
            return contextItem.symbolName

        case 'openctx':
            return contextItem.mention?.data?.mentionLabel || contextItem.title
    }
    // @ts-ignore
    throw new Error(`unrecognized context item type ${contextItem.type}`)
}

function trimCommonRepoNamePrefixes(repoName: string): string {
    return repoName.replace(/^(github|gitlab)\.com\//, '')
}
