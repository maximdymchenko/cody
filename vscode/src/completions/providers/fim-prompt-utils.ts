import { PromptString, ps } from '@sourcegraph/cody-shared'
import type * as vscode from 'vscode'

export interface FIMContextPromptParams {
    filename: vscode.Uri
    content: PromptString
}

export interface FIMInfillingPromptParams {
    repoName: PromptString | undefined
    filename: PromptString
    intro: PromptString
    prefix: PromptString
    suffix: PromptString
}

export interface FIMModelSpecificPromptExtractor {
    getContextPrompt(contextParams: FIMContextPromptParams): PromptString
    getInfillingPrompt(infillParams: FIMInfillingPromptParams): PromptString
}

export class StarcoderPromptExtractor implements FIMModelSpecificPromptExtractor {
    getContextPrompt(param: FIMContextPromptParams): PromptString {
        return getDefaultContextPrompt(param.filename, param.content)
    }

    getInfillingPrompt(param: FIMInfillingPromptParams): PromptString {
        // c.f. https://huggingface.co/bigcode/starcoder#fill-in-the-middle
        // c.f. https://arxiv.org/pdf/2305.06161.pdf
        return ps`<filename>${param.filename}<fim_prefix>${param.intro}${param.prefix}<fim_suffix>${param.suffix}<fim_middle>`
    }
}

export class CodeLlamaPromptExtractor implements FIMModelSpecificPromptExtractor {
    getContextPrompt(param: FIMContextPromptParams): PromptString {
        return getDefaultContextPrompt(param.filename, param.content)
    }

    getInfillingPrompt(param: FIMInfillingPromptParams): PromptString {
        // c.f. https://github.com/facebookresearch/codellama/blob/main/llama/generation.py#L402
        return ps`<PRE> ${param.intro}${param.prefix} <SUF>${param.suffix} <MID>`
    }
}

export class DeepSeekPromptExtractor implements FIMModelSpecificPromptExtractor {
    getContextPrompt(param: FIMContextPromptParams): PromptString {
        return ps`#${PromptString.fromDisplayPath(param.filename)}\n${param.content}`
    }

    getInfillingPrompt(param: FIMInfillingPromptParams): PromptString {
        // Deepseek paper: https://arxiv.org/pdf/2401.14196
        const prompt = ps`${param.intro}\n#${param.filename}\n<｜fim▁begin｜>${param.prefix}<｜fim▁hole｜>${param.suffix}<｜fim▁end｜>`
        if (param.repoName) {
            return ps`<repo_name>${param.repoName}\n${prompt}`
        }
        return prompt
    }
}

export class DefaultModelPromptExtractor implements FIMModelSpecificPromptExtractor {
    getContextPrompt(param: FIMContextPromptParams): PromptString {
        return getDefaultContextPrompt(param.filename, param.content)
    }

    getInfillingPrompt(param: FIMInfillingPromptParams): PromptString {
        return ps`${param.intro}${param.prefix}`
    }
}

export function getDefaultContextPrompt(filename: vscode.Uri, content: PromptString): PromptString {
    return ps`Here is a reference snippet of code from ${PromptString.fromDisplayPath(
        filename
    )}:\n\n${content}`
}
