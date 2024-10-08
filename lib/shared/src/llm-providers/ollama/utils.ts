import ollama from 'ollama/browser'
import { OLLAMA_DEFAULT_CONTEXT_WINDOW } from '.'
import { Model, ModelUsage } from '../..'
import { ModelTag } from '../../models/tags'
import { CHAT_OUTPUT_TOKEN_BUDGET } from '../../token/constants'
/**
 * Fetches available Ollama models from the Ollama server.
 */
export async function fetchLocalOllamaModels(): Promise<Model[]> {
    return (await ollama.list()).models?.map(
        m =>
            new Model({
                id: `ollama/${m.name}`,
                usage: [ModelUsage.Chat, ModelUsage.Edit],
                contextWindow: {
                    input: OLLAMA_DEFAULT_CONTEXT_WINDOW,
                    output: CHAT_OUTPUT_TOKEN_BUDGET,
                },
                tags: [ModelTag.Local, ModelTag.Ollama, ModelTag.Experimental],
            })
    )
}
