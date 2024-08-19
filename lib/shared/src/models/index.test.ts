import { beforeEach, describe, expect, it } from 'vitest'
import { AUTH_STATUS_FIXTURE, type AuthStatus } from '../auth/types'
import {
    Model,
    type ModelCategory,
    type ModelTier,
    ModelsService,
    type PerSitePreferences,
    type ServerModel,
    type ServerModelConfiguration,
} from '../models/index'
import { CHAT_INPUT_TOKEN_BUDGET, CHAT_OUTPUT_TOKEN_BUDGET } from '../token/constants'
import { getDotComDefaultModels } from './dotcom'
import { ModelTag } from './tags'
import { ModelUsage } from './types'

describe('Model Provider', () => {
    const dotcomUserAuthStatus: AuthStatus = {
        ...AUTH_STATUS_FIXTURE,
        endpoint: 'https://sourcegraph.example.com',
        authenticated: true,
        isDotCom: true,
    }

    const enterpriseAuthStatus: AuthStatus = {
        ...AUTH_STATUS_FIXTURE,
        endpoint: 'https://sourcegraph.example.com',
        authenticated: true,
        isDotCom: false,
    }

    const MOCK_STORAGE: ConstructorParameters<typeof ModelsService>[0] = {
        get: () => null,
        set: () => Promise.resolve(undefined),
        delete: () => Promise.resolve(undefined),
    }

    // Reset service
    let modelsService = new ModelsService(MOCK_STORAGE)
    beforeEach(() => {
        modelsService = new ModelsService(MOCK_STORAGE)
    })

    describe('getContextWindowByID', () => {
        it('returns default token limit for unknown model', () => {
            const max = modelsService.getContextWindowByID('unknown-model')
            expect(max).toEqual({ input: CHAT_INPUT_TOKEN_BUDGET, output: CHAT_OUTPUT_TOKEN_BUDGET })
        })

        it('returns max token limit for known DotCom chat model ', () => {
            const models = getDotComDefaultModels()
            modelsService.setModels(models)
            expect(models[0].model).toBeDefined()
            const cw = modelsService.getContextWindowByID(models[0].model)
            expect(cw).toStrictEqual(models[0].contextWindow)
        })

        it('returns max token limit for known DotCom chat model with higher context window (claude 3)', () => {
            const models = getDotComDefaultModels()
            modelsService.setModels(models)
            const claude3SonnetModelID = 'anthropic/claude-3-5-sonnet-20240620'
            const claude3SonnetModel = modelsService.getModelByID(claude3SonnetModelID)
            expect(claude3SonnetModel?.contextWindow?.context?.user).greaterThan(0)
            expect(claude3SonnetModel).toBeDefined()
            const cw = modelsService.getContextWindowByID(claude3SonnetModelID)
            expect(cw).toEqual(claude3SonnetModel?.contextWindow)
        })

        it('returns default token limit for unknown model - Enterprise user', () => {
            const cw = modelsService.getContextWindowByID('unknown-model')
            expect(cw).toEqual({ input: CHAT_INPUT_TOKEN_BUDGET, output: CHAT_OUTPUT_TOKEN_BUDGET })
        })

        it('returns max token limit for known model - Enterprise user', () => {
            modelsService.setModels([
                new Model({
                    model: 'enterprise-model',
                    usage: [ModelUsage.Chat],
                    contextWindow: { input: 200, output: 100 },
                }),
            ])
            const cw = modelsService.getContextWindowByID('enterprise-model')
            expect(cw.input).toEqual(200)
        })
    })

    describe('getMaxOutputCharsByModel', () => {
        it('returns default token limit for unknown model', () => {
            const { output } = modelsService.getContextWindowByID('unknown-model')
            expect(output).toEqual(CHAT_OUTPUT_TOKEN_BUDGET)
        })

        it('returns max token limit for known chat model', () => {
            const knownModel = getDotComDefaultModels()[0]
            const { output } = modelsService.getContextWindowByID(knownModel.model)
            expect(output).toEqual(knownModel.contextWindow.output)
        })

        it('returns default token limit for unknown model - Enterprise user', () => {
            const { output } = modelsService.getContextWindowByID('unknown-model')
            expect(output).toEqual(CHAT_OUTPUT_TOKEN_BUDGET)
        })

        it('returns max token limit for known model - Enterprise user', () => {
            modelsService.setModels([
                new Model({
                    model: 'model-with-limit',
                    usage: [ModelUsage.Chat],
                    contextWindow: { input: 8000, output: 2000 },
                }),
            ])
            const { output } = modelsService.getContextWindowByID('model-with-limit')
            expect(output).toEqual(2000)
        })
    })

    describe('Selected models', () => {
        const model1chat = new Model({
            model: 'model-1',
            usage: [ModelUsage.Chat],
        })

        const model2chat = new Model({
            model: 'model-2',
            usage: [ModelUsage.Chat],
        })

        const model3all = new Model({
            model: 'model-3',
            usage: [ModelUsage.Chat, ModelUsage.Edit],
        })

        const model4edit = new Model({
            model: 'model-4',
            usage: [ModelUsage.Edit],
        })

        beforeEach(() => {
            modelsService.setAuthStatus(dotcomUserAuthStatus)
            modelsService.setModels([model1chat, model2chat, model3all, model4edit])
        })

        it('allows setting default models per type', () => {
            modelsService.setSelectedModel(ModelUsage.Chat, model2chat)
            modelsService.setSelectedModel(ModelUsage.Edit, model4edit)
            expect(modelsService.getDefaultEditModel()).toBe(model4edit.model)
            expect(modelsService.getDefaultChatModel()).toBe(model2chat.model)
        })

        it('only allows setting known models as default', async () => {
            // Set default before settings models is a no-op
            modelsService.setModels([])
            await modelsService.setSelectedModel(ModelUsage.Chat, model2chat.model)
            modelsService.setModels([model1chat, model2chat])
            expect(modelsService.getDefaultChatModel()).toBe(model1chat.model)
        })

        it('only allows setting appropriate model types', () => {
            modelsService.setModels([model1chat, model2chat, model3all, model4edit])
            expect(async () =>
                modelsService.setSelectedModel(ModelUsage.Chat, model4edit)
            ).rejects.toThrow('Model "model-4" is not compatible with usage type "chat".')
            expect(async () =>
                modelsService.setSelectedModel(ModelUsage.Edit, model1chat)
            ).rejects.toThrow('Model "model-1" is not compatible with usage type "edit"')
        })
    })

    describe('server sent models', () => {
        const serverOpus: ServerModel = {
            modelRef: 'anthropic::unknown::anthropic.claude-3-opus-20240229-v1_0',
            displayName: 'Opus',
            modelName: 'anthropic.claude-3-opus-20240229-v1_0',
            capabilities: ['chat'],
            category: 'balanced' as ModelCategory,
            status: 'stable',
            tier: 'enterprise' as ModelTier,
            contextWindow: {
                maxInputTokens: 9000,
                maxOutputTokens: 4000,
            },
        }

        const opus = Model.fromApi(serverOpus)

        const serverClaude: ServerModel = {
            modelRef: 'anthropic::unknown::anthropic.claude-instant-v1',
            displayName: 'Instant',
            modelName: 'anthropic.claude-instant-v1',
            capabilities: ['autocomplete'],
            category: 'balanced' as ModelCategory,
            status: 'stable',
            tier: 'enterprise' as ModelTier,
            contextWindow: {
                maxInputTokens: 9000,
                maxOutputTokens: 4000,
            },
        }
        const claude = Model.fromApi(serverClaude)

        const serverTitan: ServerModel = {
            modelRef: 'anthropic::unknown::amazon.titan-text-lite-v1',
            displayName: 'Titan',
            modelName: 'amazon.titan-text-lite-v1',
            capabilities: ['autocomplete', 'chat'],
            category: 'balanced' as ModelCategory,
            status: 'stable',
            tier: 'enterprise' as ModelTier,
            contextWindow: {
                maxInputTokens: 9000,
                maxOutputTokens: 4000,
            },
        }

        const titan = Model.fromApi(serverTitan)

        const SERVER_MODELS: ServerModelConfiguration = {
            schemaVersion: '1.0',
            revision: '-',
            providers: [],
            models: [serverOpus, serverClaude, serverTitan],
            defaultModels: {
                chat: serverOpus.modelRef,
                fastChat: serverTitan.modelRef,
                codeCompletion: serverClaude.modelRef,
            },
        }

        let storage: TestStorage

        class TestStorage {
            constructor(public data: Map<string, string> = new Map()) {}
            get(key: string): string | null {
                return this.data.get(key) ?? null
            }

            async set(key: string, value: string) {
                await this.data.set(key, value)
            }

            async delete(key: string) {
                this.data.delete(key)
            }

            parse(): PerSitePreferences | undefined {
                const dumped = this.data.get('model-preferences')
                console.log(dumped)
                if (dumped) {
                    return JSON.parse(dumped)
                }
                return undefined
            }
        }

        beforeEach(async () => {
            storage = new TestStorage()
            modelsService = new ModelsService(storage)
            modelsService.setAuthStatus(enterpriseAuthStatus)
            await modelsService.setServerSentModels(SERVER_MODELS)
        })

        it('constructs from server models', () => {
            expect(opus.model).toBe(serverOpus.modelName)
            expect(opus.title).toBe(serverOpus.displayName)
            expect(opus.provider).toBe('anthropic')
            expect(opus.contextWindow).toEqual({ input: 9000, output: 4000 })
            expect(Model.tier(opus)).toBe(ModelTag.Enterprise)
        })

        it("sets server models and default models if they're not already set", () => {
            // expect all defaults to be set
            expect(modelsService.getDefaultChatModel()).toBe(opus.model)
            expect(modelsService.getDefaultEditModel()).toBe(opus.model)
            expect(modelsService.getDefaultModel(ModelUsage.Autocomplete)).toStrictEqual(claude)

            // expect storage to be updated

            const parsed = storage.parse()?.[enterpriseAuthStatus.endpoint].defaults
            expect(parsed?.chat).toBe(opus.model)
            expect(parsed?.edit).toBe(opus.model)
            expect(parsed?.autocomplete).toBe(claude.model)
        })

        it('allows updating the selected model', async () => {
            await modelsService.setSelectedModel(ModelUsage.Chat, titan)
            expect(modelsService.getDefaultChatModel()).toBe(titan.model)

            //  however, the defaults are still as the server set
            expect(storage.parse()?.[enterpriseAuthStatus.endpoint].defaults.chat).toBe(opus.model)
        })

        it('uses new server defaults when provided', async () => {
            await modelsService.setSelectedModel(ModelUsage.Chat, titan)
            expect(modelsService.getDefaultChatModel()).toBe(titan.model)

            // New server config updates the defaults for everything to titan
            await modelsService.setServerSentModels({
                ...SERVER_MODELS,
                defaultModels: {
                    // Chat is not updated, while other models are
                    chat: SERVER_MODELS.defaultModels.chat,
                    fastChat: serverTitan.modelRef,
                    codeCompletion: serverTitan.modelRef,
                },
            })

            // User selection is preserved
            expect(modelsService.getDefaultChatModel()).toBe(titan.model)
        })

        it("doesn't drop the selected model if it's updated", async () => {
            await modelsService.setSelectedModel(ModelUsage.Chat, titan)
            expect(modelsService.getDefaultChatModel()).toBe(titan.model)

            // New server config updates the defaults for everything to titan
            await modelsService.setServerSentModels({
                ...SERVER_MODELS,
                defaultModels: {
                    chat: serverTitan.modelRef,
                    fastChat: serverTitan.modelRef,
                    codeCompletion: serverTitan.modelRef,
                },
            })

            expect(modelsService.getDefaultChatModel()).toBe(titan.model)
        })
    })

    describe('isModelAvailable', () => {
        const enterpriseModel = new Model({
            model: 'enterprise-model',
            usage: [ModelUsage.Chat],
            tags: [ModelTag.Enterprise],
        })
        const proModel = new Model({
            model: 'pro-model',
            usage: [ModelUsage.Chat],
            tags: [ModelTag.Pro],
        })
        const freeModel = new Model({
            model: 'free-model',
            usage: [ModelUsage.Chat],
            // We don't include ModelTag.Free here to test that it's not required.
            tags: [],
        })

        beforeEach(() => {
            modelsService.setModels([enterpriseModel, proModel, freeModel])
        })

        it('returns false for unknown model', () => {
            modelsService.setAuthStatus(dotcomUserAuthStatus)
            expect(modelsService.isModelAvailable('unknown-model')).toBe(false)
        })

        it('allows enterprise user to use any model', () => {
            modelsService.setAuthStatus(enterpriseAuthStatus)
            expect(modelsService.isModelAvailable(enterpriseModel)).toBe(true)
            expect(modelsService.isModelAvailable(proModel)).toBe(true)
            expect(modelsService.isModelAvailable(freeModel)).toBe(true)
        })

        it('allows Cody Pro user to use Pro and Free models', () => {
            modelsService.setAuthStatus(dotcomUserAuthStatus)
            expect(modelsService.isModelAvailable(enterpriseModel)).toBe(false)
            expect(modelsService.isModelAvailable(proModel)).toBe(true)
            expect(modelsService.isModelAvailable(freeModel)).toBe(true)
        })

        it('handles model passed as string', () => {
            modelsService.setAuthStatus(dotcomUserAuthStatus)
            expect(modelsService.isModelAvailable(proModel.model)).toBe(true)
        })
    })
})
