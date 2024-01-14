// Add anything else here that needs to be used outside of this library.

export { ChatModelProvider } from './chat-models'
export { BotResponseMultiplexer } from './chat/bot-response-multiplexer'
export { ChatClient } from './chat/chat'
export { createClient, type Client } from './chat/client'
export type { ChatContextStatus } from './chat/context'
export { ignores, isCodyIgnoredFile } from './chat/context-filter'
export { CODY_IGNORE_FILENAME_POSIX_GLOB, type IgnoreFileContent } from './chat/ignore-helper'
export { renderCodyMarkdown } from './chat/markdown'
export { getSimplePreamble } from './chat/preamble'
export { Transcript } from './chat/transcript'
export type { TranscriptJSON } from './chat/transcript'
export { Interaction } from './chat/transcript/interaction'
export type { InteractionJSON } from './chat/transcript/interaction'
export { errorToChatError } from './chat/transcript/messages'
export type {
    ChatButton,
    ChatError,
    ChatEventSource,
    ChatHistory,
    ChatMessage,
    InteractionMessage,
    UserLocalHistory,
} from './chat/transcript/messages'
export { Typewriter } from './chat/typewriter'
export { reformatBotMessageForChat } from './chat/viewHelpers'
export { CodebaseContext } from './codebase-context'
export type {
    ContextGroup,
    ContextProvider,
    ContextStatusProvider,
    Disposable,
    EnhancedContextContextT,
    LocalEmbeddingsProvider,
    SearchProvider,
} from './codebase-context/context-status'
export { createContextMessageByFile, getContextMessageWithResponse } from './codebase-context/messages'
export type {
    ContextFile,
    ContextFileFile,
    ContextFileSource,
    ContextFileSymbol,
    ContextFileType,
    ContextMessage,
    HoverContext,
    PreciseContext,
    SymbolKind,
} from './codebase-context/messages'
export { defaultCodyCommandContext } from './commands'
export type { CodyCommand, CodyCommandContext, CustomCommandType } from './commands'
export { basename, dedupeWith, isDefined, isErrorLike, pluralize } from './common'
export { ProgrammingLanguage, languageFromFilename, markdownCodeBlockLanguageIDForFilename } from './common/languages'
export { renderMarkdown } from './common/markdown'
export { isWindows } from './common/platform'
export type { FileURI } from './common/uri'
export type {
    AutocompleteTimeouts,
    Configuration,
    ConfigurationUseContext,
    ConfigurationWithAccessToken,
    OllamaGenerateParameters,
    OllamaOptions,
} from './configuration'
export { NoopEditor } from './editor'
export type {
    ActiveTextEditor,
    ActiveTextEditorDiagnostic,
    ActiveTextEditorDiagnosticType,
    ActiveTextEditorSelection,
    ActiveTextEditorSelectionRange,
    ActiveTextEditorViewControllers,
    ActiveTextEditorVisibleContent,
    Editor,
    VsCodeCommandsController,
} from './editor'
export { displayPath, setDisplayPathEnvInfo, type DisplayPathEnvInfo } from './editor/displayPath'
export { hydrateAfterPostMessage } from './editor/hydrateAfterPostMessage'
export { EmbeddingsDetector } from './embeddings/EmbeddingsDetector'
export { SourcegraphEmbeddingsSearchClient } from './embeddings/client'
export { FeatureFlag, FeatureFlagProvider, featureFlagProvider } from './experimentation/FeatureFlagProvider'
export type { GraphContextFetcher } from './graph-context'
export { GuardrailsPost, summariseAttribution } from './guardrails'
export type { Attribution, Guardrails } from './guardrails'
export { SourcegraphGuardrailsClient } from './guardrails/client'
export type { IntentClassificationOption, IntentDetector } from './intent-detector'
export { SourcegraphIntentDetectorClient } from './intent-detector/client'
export type {
    ContextResult,
    FilenameContextFetcher,
    IndexedKeywordContextFetcher,
    LocalEmbeddingsFetcher,
    Result,
    SearchPanelFile,
    SearchPanelSnippet,
} from './local-context'
export {
    MAX_BYTES_PER_FILE,
    MAX_CURRENT_FILE_TOKENS,
    MAX_HUMAN_INPUT_TOKENS,
    NUM_CODE_RESULTS,
    NUM_TEXT_RESULTS,
    SURROUNDING_LINES,
    tokensToChars,
} from './prompt/constants'
export { PromptMixin, newPromptMixin } from './prompt/prompt-mixin'
export * from './prompt/templates'
export { truncateText, truncateTextNearestLine, truncateTextStart } from './prompt/truncation'
export type { Message } from './sourcegraph-api'
export { SourcegraphBrowserCompletionsClient } from './sourcegraph-api/completions/browserClient'
export { SourcegraphCompletionsClient } from './sourcegraph-api/completions/client'
export type { CompletionLogger, CompletionsClientConfig } from './sourcegraph-api/completions/client'
export type { CompletionParameters, CompletionResponse, Event } from './sourcegraph-api/completions/types'
export { DOTCOM_URL, LOCAL_APP_URL, isDotCom } from './sourcegraph-api/environments'
export {
    AbortError,
    ContextWindowLimitError,
    NetworkError,
    RateLimitError,
    TimeoutError,
    TracedError,
    isAbortError,
    isAuthError,
    isNetworkError,
    isRateLimitError,
} from './sourcegraph-api/errors'
export { SourcegraphGraphQLAPIClient, graphqlClient, type EmbeddingsSearchResults } from './sourcegraph-api/graphql'
export {
    ConfigFeaturesSingleton,
    addCustomUserAgent,
    customUserAgent,
    isNodeResponse,
    setUserAgent,
    type BrowserOrNodeResponse,
    type GraphQLAPIClientConfig,
    type LogEventMode,
} from './sourcegraph-api/graphql/client'
export type { CodyLLMSiteConfiguration, EmbeddingsSearchResult, event } from './sourcegraph-api/graphql/client'
export { GraphQLTelemetryExporter } from './sourcegraph-api/telemetry/GraphQLTelemetryExporter'
export { NOOP_TELEMETRY_SERVICE } from './telemetry'
export type { TelemetryEventProperties, TelemetryService } from './telemetry'
export { type BillingCategory, type BillingProduct } from './telemetry-v2'
export {
    MockServerTelemetryRecorderProvider,
    NoOpTelemetryRecorderProvider,
    TelemetryRecorderProvider,
} from './telemetry-v2/TelemetryRecorderProvider'
export type { TelemetryRecorder } from './telemetry-v2/TelemetryRecorderProvider'
export { EventLogger } from './telemetry/EventLogger'
export type { ExtensionDetails } from './telemetry/EventLogger'
export { testFileUri } from './test/path-helpers'
export { addTraceparent, getActiveTraceAndSpanId, wrapInActiveSpan } from './tracing'
export { convertGitCloneURLToCodebaseName, isError } from './utils'
export { logDebug, logError, setLogger } from './logger'
