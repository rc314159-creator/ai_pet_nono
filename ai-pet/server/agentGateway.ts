import { OpenAIProvider, Runner } from "@openai/agents";

export type AgentGatewayProvider = "llmmelon" | "aihubmix" | "yunwu" | "openai" | "local";

export type AgentGatewayConfig = {
  provider: AgentGatewayProvider;
  configured: boolean;
  apiKey?: string;
  baseURL?: string;
  model: string;
};

const runnerCache = new Map<string, Runner>();

function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY || process.env.AI_PET_OPENAI_API_KEY || "";
}

function getLlmmelonApiKey() {
  return process.env.LLMMELON_API_KEY || process.env.AI_PET_AGENT_API_KEY || "";
}

function getAiHubMixApiKey() {
  return process.env.AIHUBMIX_API_KEY || process.env.AI_HUB_MIX_API_KEY || "";
}

function getYunwuApiKey() {
  return process.env.YUNWU_API_KEY || "";
}

export function getAgentGatewayConfig(): AgentGatewayConfig {
  const explicitProvider = process.env.AI_PET_AGENT_PROVIDER?.trim().toLowerCase();
  const aiHubMixApiKey = getAiHubMixApiKey();
  const yunwuApiKey = getYunwuApiKey();
  const llmmelonApiKey = getLlmmelonApiKey();
  const openAiApiKey = getOpenAiApiKey();

  if (explicitProvider === "aihubmix" && aiHubMixApiKey) {
    return {
      provider: "aihubmix",
      configured: true,
      apiKey: aiHubMixApiKey,
      baseURL: process.env.AIHUBMIX_BASE_URL || process.env.AI_HUB_MIX_BASE_URL || "https://aihubmix.com/v1",
      model: process.env.AI_PET_AGENT_MODEL || process.env.AIHUBMIX_MODEL || "claude-sonnet-4-6"
    };
  }

  if (explicitProvider === "yunwu" && yunwuApiKey) {
    return {
      provider: "yunwu",
      configured: true,
      apiKey: yunwuApiKey,
      baseURL: process.env.YUNWU_BASE_URL || "https://yunwu.ai/v1",
      model: process.env.AI_PET_AGENT_MODEL || process.env.YUNWU_MODEL || "claude-sonnet-4-6"
    };
  }

  if (explicitProvider !== "openai" && llmmelonApiKey) {
    return {
      provider: "llmmelon",
      configured: true,
      apiKey: llmmelonApiKey,
      baseURL: process.env.LLMMELON_BASE_URL || "https://llmmelon.cloud/v1",
      model: process.env.AI_PET_AGENT_MODEL || process.env.LLMMELON_MODEL || "gpt-4o-mini"
    };
  }

  if (openAiApiKey) {
    return {
      provider: "openai",
      configured: true,
      apiKey: openAiApiKey,
      baseURL: process.env.OPENAI_BASE_URL,
      model: process.env.AI_PET_AGENT_MODEL || "gpt-4.1-mini"
    };
  }

  return {
    provider: "local",
    configured: false,
    model: "persona-rule-engine"
  };
}

export function getAgentRunner(config: AgentGatewayConfig) {
  if (!config.configured || !config.apiKey) return undefined;

  const cacheKey = JSON.stringify({
    provider: config.provider,
    baseURL: config.baseURL,
    model: config.model
  });
  const existing = runnerCache.get(cacheKey);
  if (existing) return existing;

  const runner = new Runner({
    modelProvider: new OpenAIProvider({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      useResponses: false,
      cacheResponsesWebSocketModels: false,
      strictFeatureValidation: false
    }),
    tracingDisabled: true,
    traceIncludeSensitiveData: false
  });
  runnerCache.set(cacheKey, runner);
  return runner;
}
