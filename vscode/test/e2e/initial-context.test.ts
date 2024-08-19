import { expect } from '@playwright/test'
import { chatInputMentions, createEmptyChatPanel, sidebarSignin } from './common'
import { mockEnterpriseRepoMapping, testWithGitRemote } from './helpers'

// testWithGitRemote.extend<DotcomUrlOverride>({ dotcomUrl: mockServer.SERVER_URL })(
//     'initial context - self-serve repo',
//     async ({ page, sidebar }) => {
//         await sidebarSignin(page, sidebar)
//         const chatFrame = getChatSidebarPanel(page)
//         const lastChatInput = getChatInputs(chatFrame).last()

//         // The current repository should be initially present in the chat input.
//         await expect(chatInputMentions(lastChatInput)).toHaveText(['myrepo'])
//     }
// )

// NEXT(beyang): figure out where intiial context is populated and why enterprise context isn't shown

testWithGitRemote('initial context - enterprise repo', async ({ page, sidebar, server }) => {
    mockEnterpriseRepoMapping(server, 'host.example/user/myrepo')

    await sidebarSignin(page, sidebar)

    await new Promise(resolve => setTimeout(resolve, 5_000))

    const [, lastChatInput] = await createEmptyChatPanel(page)

    await new Promise(resolve => setTimeout(resolve, 1_000_000))

    // The current repository should be initially present in the chat input.
    await expect(chatInputMentions(lastChatInput)).toHaveText(['host.example/user/myrepo'])
})

// testWithGitRemote('initial context - file', async ({ page, sidebar, server }) => {
//     mockEnterpriseRepoMapping(server, 'host.example/user/myrepo')

//     await sidebarSignin(page, sidebar)

//     await openFileInEditorTab(page, 'main.c')

//     const [, lastChatInput] = await createEmptyChatPanel(page)

//     await expect(chatInputMentions(lastChatInput)).toHaveText(['host.example/user/myrepo', 'main.c'])

//     await selectLineRangeInEditorTab(page, 2, 4)
//     await expect(chatInputMentions(lastChatInput)).toHaveText(['host.example/user/myrepo', 'main.c:2-4'])

//     await selectLineRangeInEditorTab(page, 1, 3)
//     await expect(chatInputMentions(lastChatInput)).toHaveText(['host.example/user/myrepo', 'main.c:1-3'])

//     await openFileInEditorTab(page, 'README.md')
//     await expect(chatInputMentions(lastChatInput)).toHaveText(['host.example/user/myrepo', 'README.md'])

//     await clickEditorTab(page, 'main.c')
//     await expect(chatInputMentions(lastChatInput)).toHaveText(['host.example/user/myrepo', 'main.c:1-3'])

//     // After typing into the input, it no longer updates the initial context.
//     await lastChatInput.press('x')
//     await clickEditorTab(page, 'README.md')
//     await expect(chatInputMentions(lastChatInput)).toHaveText(['host.example/user/myrepo', 'main.c:1-3'])
// })

// testWithGitRemote.extend<DotcomUrlOverride>({ dotcomUrl: mockServer.SERVER_URL })(
//     'chat try-again actions',
//     async ({ page, sidebar }) => {
//         await sidebarSignin(page, sidebar)
//         await openFileInEditorTab(page, 'main.c')

//         const chatPanel = getChatSidebarPanel(page)
//         const firstChatInput = getChatInputs(chatPanel).first()
//         await expect(chatInputMentions(firstChatInput)).toHaveText(['myrepo', 'main.c'])
//         await firstChatInput.pressSequentially('xyz')
//         await firstChatInput.press('Enter')

//         const contextFocusActions = chatPanel.getByRole('group', {
//             name: 'Try again with different context',
//         })
//         await expect(contextFocusActions).toBeVisible()
//         await expect(contextFocusActions.getByRole('button')).toHaveText([
//             'Public knowledge only',
//             'Current file only',
//             'Add context...',
//         ])

//         const currentFileOnlyButton = contextFocusActions.getByRole('button', {
//             name: 'Current file only',
//         })
//         await currentFileOnlyButton.click()
//         await expect(chatInputMentions(firstChatInput)).toHaveText(['main.c'])
//         await expect(firstChatInput).toHaveText('main.c xyz')

//         const publicKnowledgeOnlyButton = contextFocusActions.getByRole('button', {
//             name: 'Public knowledge only',
//         })
//         await publicKnowledgeOnlyButton.click()
//         await expect(chatInputMentions(firstChatInput)).toHaveCount(0)
//         await expect(firstChatInput).toHaveText('xyz')

//         const addContextButton = contextFocusActions.getByRole('button', {
//             name: 'Add context...',
//         })
//         await addContextButton.click()
//         await expect(firstChatInput).toBeFocused()
//         await expect(firstChatInput).toHaveText('xyz @')
//     }
// )
