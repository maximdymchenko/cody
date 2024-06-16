import type { SerializedLexicalNode } from 'lexical'
import { STATE_VERSION_CURRENT, type SerializedPromptEditorState } from './editorState'
import type { SerializedContextItemMentionNode, SerializedContextItemMentionTextNode } from './nodes'

export const FILE_MENTION_EDITOR_STATE_FIXTURE: SerializedPromptEditorState = {
    v: STATE_VERSION_CURRENT,
    minReaderV: STATE_VERSION_CURRENT,
    lexicalEditorState: {
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'What does ',
                            type: 'text',
                            version: 1,
                        },
                        {
                            type: 'mention',
                            version: 1,
                            contextItem: {
                                type: 'symbol',
                                uri: 'file:///a/b/file1.go',
                                range: {
                                    start: {
                                        line: 2,
                                        character: 13,
                                    },
                                    end: {
                                        line: 4,
                                        character: 1,
                                    },
                                },
                                symbolName: 'Symbol1',
                                kind: 'function',
                            },
                            isFromInitialContext: false,
                            text: 'Symbol1',
                        } satisfies SerializedContextItemMentionNode,
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: ' in ',
                            type: 'text',
                            version: 1,
                        },
                        {
                            type: 'mention',
                            version: 1,
                            contextItem: {
                                type: 'file',
                                uri: 'file:///dir/dir/file-a-1.py',
                            },
                            isFromInitialContext: false,
                            text: 'file-a-1.py',
                        } satisfies SerializedContextItemMentionNode,
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: ' do? Also use ',
                            type: 'text',
                            version: 1,
                        },
                        {
                            type: 'mention',
                            version: 1,
                            contextItem: {
                                type: 'file',
                                uri: 'file:///dir/dir/README.md',
                                range: {
                                    start: {
                                        line: 1,
                                        character: 0,
                                    },
                                    end: {
                                        line: 8,
                                        character: 0,
                                    },
                                },
                            },
                            isFromInitialContext: false,
                            text: 'README.md:2-8',
                        } satisfies SerializedContextItemMentionNode,
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '.',
                            type: 'text',
                            version: 1,
                        },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                } as SerializedLexicalNode,
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
        },
    },
}

export const FILE_TEXT_MENTION_EDITOR_STATE_FIXTURE: SerializedPromptEditorState = {
    v: STATE_VERSION_CURRENT,
    minReaderV: STATE_VERSION_CURRENT,
    lexicalEditorState: {
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'What does ',
                            type: 'text',
                            version: 1,
                        },
                        {
                            detail: 1,
                            format: 0,
                            mode: 'token',
                            style: '',
                            text: '@Symbol1',
                            type: 'contextItemMention',
                            version: 1,
                            contextItem: {
                                type: 'symbol',
                                uri: 'file:///a/b/file1.go',
                                range: {
                                    start: {
                                        line: 2,
                                        character: 13,
                                    },
                                    end: {
                                        line: 4,
                                        character: 1,
                                    },
                                },
                                symbolName: 'Symbol1',
                                kind: 'function',
                            },
                            isFromInitialContext: false,
                        } satisfies SerializedContextItemMentionTextNode,
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: ' in ',
                            type: 'text',
                            version: 1,
                        },
                        {
                            detail: 1,
                            format: 0,
                            mode: 'token',
                            style: '',
                            text: '@file-a-1.py',
                            type: 'contextItemMention',
                            version: 1,
                            contextItem: {
                                type: 'file',
                                uri: 'file:///dir/dir/file-a-1.py',
                            },
                            isFromInitialContext: false,
                        } satisfies SerializedContextItemMentionTextNode,
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: ' do? Also use ',
                            type: 'text',
                            version: 1,
                        },
                        {
                            detail: 1,
                            format: 0,
                            mode: 'token',
                            style: '',
                            text: '@README.md:2-8',
                            type: 'contextItemMention',
                            version: 1,
                            contextItem: {
                                type: 'file',
                                uri: 'file:///dir/dir/README.md',
                                range: {
                                    start: {
                                        line: 1,
                                        character: 0,
                                    },
                                    end: {
                                        line: 8,
                                        character: 0,
                                    },
                                },
                            },
                            isFromInitialContext: false,
                        } satisfies SerializedContextItemMentionTextNode,
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '.',
                            type: 'text',
                            version: 1,
                        },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                } as SerializedLexicalNode,
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
        },
    },
}

export const UNKNOWN_NODES_EDITOR_STATE_FIXTURE: SerializedPromptEditorState = {
    v: STATE_VERSION_CURRENT,
    minReaderV: STATE_VERSION_CURRENT,
    lexicalEditorState: {
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'What is ',
                            type: 'text',
                            version: 1,
                        },
                        {
                            type: 'unknownNode',
                            version: 1,
                            foo: 'bar',

                            // The unknownNode has `text`, which makes it backwards compatible.
                            // Unrecognized nodes are treated as text nodes.
                            text: 'unknown-node-content-foo',
                        },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                } as SerializedLexicalNode,
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
        },
    },
}
