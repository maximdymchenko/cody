import {
    AUTH_STATUS_FIXTURE,
    type AuthCredentials,
    type AuthStatus,
    type ClientConfiguration,
    type CodeCompletionsClient,
    type CodyLLMSiteConfiguration,
    type GraphQLAPIClientConfig,
    graphqlClient,
} from '@sourcegraph/cody-shared'
import { beforeAll, describe, expect, it } from 'vitest'
import type * as vscode from 'vscode'
import { localStorage } from '../../services/LocalStorageProvider'
import { DEFAULT_VSCODE_SETTINGS } from '../../testutils/mocks'

import { createProviderConfig } from './create-provider'

const getVSCodeConfigurationWithAccessToken = (
    config: Partial<ClientConfiguration> = {}
): ClientConfiguration => ({
    ...DEFAULT_VSCODE_SETTINGS,
    ...config,
})

const DUMMY_AUTH: Pick<AuthCredentials, 'accessToken'> = {
    accessToken: 'foobar',
}

const dummyCodeCompletionsClient: CodeCompletionsClient = {
    // biome-ignore lint/correctness/useYield: keep TS happy in tests.
    async *complete() {
        return { completionResponse: { completion: '', stopReason: '' } }
    },
    logger: undefined,
    onConfigurationChange: () => undefined,
}

const dummyAuthStatus: AuthStatus = AUTH_STATUS_FIXTURE

graphqlClient.setResolvedConfigurationObservable({} as unknown as GraphQLAPIClientConfig)

describe('createProviderConfig', () => {
    describe('if completions provider fields are defined in VSCode settings', () => {
        it('returns null if completions provider is not supported', async () => {
            const provider = await createProviderConfig(
                getVSCodeConfigurationWithAccessToken({
                    autocompleteAdvancedProvider:
                        'nasa-ai' as ClientConfiguration['autocompleteAdvancedProvider'],
                }),
                DUMMY_AUTH,
                dummyCodeCompletionsClient,
                dummyAuthStatus
            )
            expect(provider).toBeNull()
        })
    })

    describe('if completions provider field is not defined in VSCode settings', () => {
        beforeAll(async () => {
            localStorage.setStorage({
                get: () => null,
                update: () => {},
            } as any as vscode.Memento)
        })

        it('returns "anthropic" if completions provider is not configured', async () => {
            const provider = await createProviderConfig(
                getVSCodeConfigurationWithAccessToken({
                    autocompleteAdvancedProvider:
                        null as ClientConfiguration['autocompleteAdvancedProvider'],
                }),
                DUMMY_AUTH,
                dummyCodeCompletionsClient,
                dummyAuthStatus
            )
            expect(provider?.identifier).toBe('anthropic')
            expect(provider?.model).toBe('anthropic/claude-instant-1.2')
        })

        it('returns "fireworks" provider config and corresponding model if specified', async () => {
            const provider = await createProviderConfig(
                getVSCodeConfigurationWithAccessToken({
                    autocompleteAdvancedProvider: 'fireworks',
                    autocompleteAdvancedModel: 'starcoder-7b',
                }),
                DUMMY_AUTH,
                dummyCodeCompletionsClient,
                dummyAuthStatus
            )
            expect(provider?.identifier).toBe('fireworks')
            expect(provider?.model).toBe('starcoder-7b')
        })

        it('returns "fireworks" provider config if specified in settings and default model', async () => {
            const provider = await createProviderConfig(
                getVSCodeConfigurationWithAccessToken({ autocompleteAdvancedProvider: 'fireworks' }),
                DUMMY_AUTH,
                dummyCodeCompletionsClient,
                dummyAuthStatus
            )
            expect(provider?.identifier).toBe('fireworks')
            expect(provider?.model).toBe('deepseek-coder-v2-lite-base')
        })

        it('returns "experimental-openaicompatible" provider config and corresponding model if specified', async () => {
            const provider = await createProviderConfig(
                getVSCodeConfigurationWithAccessToken({
                    autocompleteAdvancedProvider: 'experimental-openaicompatible',
                    autocompleteAdvancedModel: 'starchat-16b-beta',
                }),
                DUMMY_AUTH,
                dummyCodeCompletionsClient,
                dummyAuthStatus
            )
            expect(provider?.identifier).toBe('experimental-openaicompatible')
            expect(provider?.model).toBe('starchat-16b-beta')
        })

        it('returns "experimental-openaicompatible" provider config if specified in settings and default model', async () => {
            const provider = await createProviderConfig(
                getVSCodeConfigurationWithAccessToken({
                    autocompleteAdvancedProvider: 'experimental-openaicompatible',
                }),
                DUMMY_AUTH,
                dummyCodeCompletionsClient,
                dummyAuthStatus
            )
            expect(provider?.identifier).toBe('experimental-openaicompatible')
            // TODO(slimsag): make this default to starchat2 once added
            // specifically just when using `experimental-openaicompatible`
            expect(provider?.model).toBe('starcoder-hybrid')
        })

        it('returns "openai" provider config if specified in VSCode settings; model is ignored', async () => {
            const provider = await createProviderConfig(
                getVSCodeConfigurationWithAccessToken({
                    autocompleteAdvancedProvider: 'unstable-openai',
                    autocompleteAdvancedModel: 'hello-world',
                }),
                DUMMY_AUTH,
                dummyCodeCompletionsClient,
                dummyAuthStatus
            )
            expect(provider?.identifier).toBe('unstable-openai')
            expect(provider?.model).toBe('gpt-35-turbo')
        })

        it('returns "anthropic" provider config if specified in VSCode settings', async () => {
            const provider = await createProviderConfig(
                getVSCodeConfigurationWithAccessToken({
                    autocompleteAdvancedProvider: 'anthropic',
                }),
                DUMMY_AUTH,
                dummyCodeCompletionsClient,
                dummyAuthStatus
            )
            expect(provider?.identifier).toBe('anthropic')
            expect(provider?.model).toBe('anthropic/claude-instant-1.2')
        })

        it('provider specified in VSCode settings takes precedence over the one defined in the site config', async () => {
            const provider = await createProviderConfig(
                getVSCodeConfigurationWithAccessToken({
                    autocompleteAdvancedProvider: 'unstable-openai',
                }),
                DUMMY_AUTH,
                dummyCodeCompletionsClient,
                {
                    ...dummyAuthStatus,
                    configOverwrites: {
                        provider: 'azure-open-ai',
                        completionModel: 'gpt-35-turbo-test',
                    },
                }
            )
            expect(provider?.identifier).toBe('unstable-openai')
            expect(provider?.model).toBe('gpt-35-turbo')
        })
    })

    describe('completions provider and model are defined in the site config and not set in VSCode settings', () => {
        describe('if provider is "sourcegraph"', () => {
            const testCases: {
                codyLLMConfig: CodyLLMSiteConfiguration
                expected: { provider: string; model?: string } | null
            }[] = [
                // sourcegraph
                {
                    codyLLMConfig: { provider: 'sourcegraph', completionModel: 'hello-world' },
                    expected: null,
                },
                {
                    codyLLMConfig: {
                        provider: 'sourcegraph',
                        completionModel: 'anthropic/claude-instant-1.2',
                    },
                    expected: { provider: 'anthropic', model: 'anthropic/claude-instant-1.2' },
                },
                {
                    codyLLMConfig: { provider: 'sourcegraph', completionModel: 'anthropic/' },
                    expected: null,
                },
                {
                    codyLLMConfig: { provider: 'sourcegraph', completionModel: '/claude-instant-1.2' },
                    expected: null,
                },
                {
                    codyLLMConfig: { provider: 'sourcegraph', completionModel: 'fireworks/starcoder' },
                    expected: { provider: 'fireworks', model: 'starcoder' },
                },

                // aws-bedrock
                {
                    codyLLMConfig: { provider: 'aws-bedrock', completionModel: 'hello-world' },
                    expected: null,
                },
                {
                    codyLLMConfig: {
                        provider: 'aws-bedrock',
                        completionModel: 'anthropic.claude-instant-1.2',
                    },
                    expected: { provider: 'anthropic', model: 'anthropic/claude-instant-1.2' },
                },
                {
                    codyLLMConfig: { provider: 'aws-bedrock', completionModel: 'anthropic.' },
                    expected: null,
                },
                {
                    codyLLMConfig: {
                        provider: 'aws-bedrock',
                        completionModel: 'anthropic/claude-instant-1.2',
                    },
                    expected: null,
                },

                // open-ai
                {
                    codyLLMConfig: { provider: 'openai', completionModel: 'gpt-35-turbo-test' },
                    expected: { provider: 'unstable-openai', model: 'gpt-35-turbo-test' },
                },
                {
                    codyLLMConfig: { provider: 'openai' },
                    expected: { provider: 'unstable-openai', model: 'gpt-35-turbo' },
                },

                // azure-openai
                {
                    codyLLMConfig: { provider: 'azure-openai', completionModel: 'gpt-35-turbo-test' },
                    expected: { provider: 'unstable-openai', model: '' },
                },
                {
                    codyLLMConfig: { provider: 'azure-openai' },
                    expected: { provider: 'unstable-openai', model: 'gpt-35-turbo' },
                },

                // fireworks
                {
                    codyLLMConfig: { provider: 'fireworks', completionModel: 'starcoder-7b' },
                    expected: { provider: 'fireworks', model: 'starcoder-7b' },
                },
                {
                    codyLLMConfig: { provider: 'fireworks' },
                    expected: { provider: 'fireworks', model: 'deepseek-coder-v2-lite-base' },
                },

                // unknown-provider
                {
                    codyLLMConfig: {
                        provider: 'unknown-provider',
                        completionModel: 'superdupercoder-7b',
                    },
                    expected: null,
                },

                // provider not defined (backward compat)
                {
                    codyLLMConfig: { provider: undefined, completionModel: 'superdupercoder-7b' },
                    expected: { provider: 'anthropic', model: 'anthropic/claude-instant-1.2' },
                },
            ]

            for (const { codyLLMConfig, expected } of testCases) {
                it(`returns ${JSON.stringify(expected)} when cody LLM config is ${JSON.stringify(
                    codyLLMConfig
                )}`, async () => {
                    const provider = await createProviderConfig(
                        getVSCodeConfigurationWithAccessToken(),
                        DUMMY_AUTH,
                        dummyCodeCompletionsClient,
                        { ...dummyAuthStatus, configOverwrites: codyLLMConfig }
                    )
                    if (expected === null) {
                        expect(provider).toBeNull()
                    } else {
                        expect(provider?.identifier).toBe(expected.provider)
                        expect(provider?.model).toBe(expected.model)
                    }
                })
            }
        })
    })

    it('returns anthropic provider config if no completions provider specified in VSCode settings or site config', async () => {
        const provider = await createProviderConfig(
            getVSCodeConfigurationWithAccessToken(),
            DUMMY_AUTH,
            dummyCodeCompletionsClient,
            dummyAuthStatus
        )
        expect(provider?.identifier).toBe('anthropic')
        expect(provider?.model).toBe('anthropic/claude-instant-1.2')
    })
})
