import type React from 'react'

import { type InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import type { EditorState } from 'lexical'
import { useMemo } from 'react'
import styles from './RichEditor.module.css'

interface Props {
    initialEditorState: EditorState | undefined
    setEditorState: (editorState: EditorState) => void
}

export const RichEditor: React.FunctionComponent<Props> = ({ initialEditorState, setEditorState }) => {
    // biome-ignore lint/correctness/useExhaustiveDependencies: We do not want to update initialConfig because LexicalComposer is meant to be an uncontrolled component.
    const initialConfig = useMemo<InitialConfigType>(
        () => ({
            namespace: 'RichEditor',
            theme: { paragraph: styles.themeParagraph },
            onError: (error: any) => console.error(error),
            editorState: initialEditorState,
            editable: true,
        }),
        []
    )

    return (
        <div className={styles.editorShell}>
            <div className={styles.editorContainer}>
                <LexicalComposer initialConfig={initialConfig}>
                    <PlainTextPlugin
                        contentEditable={
                            <div className={styles.editorScroller}>
                                <div className={styles.editor}>
                                    <ContentEditable className={styles.contentEditable} />
                                </div>
                            </div>
                        }
                        placeholder={<div className={styles.placeholder}>Enter some text...</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <OnChangePlugin onChange={setEditorState} />
                </LexicalComposer>
            </div>
        </div>
    )
}
