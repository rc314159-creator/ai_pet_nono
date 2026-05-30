import { getPersonaForProfile, truncateAgentText } from "../src/domain/agent";
import type { AgentContextSnapshot } from "../src/domain/agent";

export type VoiceResult = {
  transcript: string;
  provider: string;
  model: string;
  voice: string;
  audioBase64?: string;
  audioContentType?: string;
  warning?: string;
};

type QwenAudioResponse = {
  output?: {
    audio?: {
      data?: string;
      url?: string;
    };
  };
  request_id?: string;
  code?: string;
  message?: string;
};

type QwenVoiceItem = {
  voice?: string;
  target_model?: string;
  voice_prompt?: string;
  preview_text?: string;
};

type QwenVoiceListResponse = {
  output?: {
    voice_list?: QwenVoiceItem[];
  };
  code?: string;
  message?: string;
};

type QwenVoiceCreateResponse = {
  output?: {
    voice?: string;
    target_model?: string;
    preview_audio?: {
      data?: string;
      response_format?: string;
    };
  };
  code?: string;
  message?: string;
};

const qwenVoiceCache = new Map<string, string>();

function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY || process.env.AI_PET_OPENAI_API_KEY || "";
}

function getQwenApiKey() {
  return (
    process.env.AI_PET_QWEN_API_KEY ||
    process.env.DASHSCOPE_API_KEY ||
    process.env.ALIYUN_BAILIAN_API_KEY ||
    ""
  );
}

function getQwenBaseUrl() {
  return (process.env.AI_PET_QWEN_BASE_URL || "https://dashscope.aliyuncs.com/api/v1").replace(/\/$/, "");
}

function getQwenVoicePrompt() {
  return (
    process.env.AI_PET_QWEN_VOICE_PROMPT ||
    "An energetic small corgi-like technology pet companion voice, youthful and lively, clear Mandarin pronunciation, warm, slightly mischievous, concise and friendly, suitable for an AI desktop pet named 科技狗."
  );
}

function getQwenPreviewText() {
  return process.env.AI_PET_QWEN_PREVIEW_TEXT || "科技狗上线，主人我在。今天我会守着 Mochi 的状态和动作。";
}

function getQwenTtsModel() {
  return process.env.AI_PET_QWEN_TTS_MODEL || process.env.AI_PET_TTS_MODEL || "qwen3-tts-vd-2026-01-26";
}

function getTtsProviderPreference() {
  return (process.env.AI_PET_TTS_PROVIDER || "qwen").trim().toLowerCase();
}

function trimWarning(prefix: string, detail: string) {
  return `${prefix}:${detail.replace(/\s+/g, " ").trim().slice(0, 180)}`;
}

async function callQwenCustomization<T>(
  input: Record<string, unknown>,
  apiKey: string,
  parameters?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${getQwenBaseUrl()}/services/audio/tts/customization`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.AI_PET_QWEN_VOICE_DESIGN_MODEL || "qwen-voice-design",
      input,
      ...(parameters ? { parameters } : {})
    })
  });

  const text = await response.text();
  if (!response.ok) throw new Error(trimWarning(`qwen_voice_api_failed_${response.status}`, text));
  return JSON.parse(text) as T;
}

async function resolveQwenVoice(apiKey: string, model: string) {
  const explicitVoice = process.env.AI_PET_QWEN_TTS_VOICE?.trim();
  if (explicitVoice) return explicitVoice;

  const cacheKey = `${getQwenBaseUrl()}::${model}::${getQwenVoicePrompt()}`;
  const cached = qwenVoiceCache.get(cacheKey);
  if (cached) return cached;

  const preferredName = process.env.AI_PET_QWEN_VOICE_PREFERRED_NAME || "tech_dog_demo";
  const prompt = getQwenVoicePrompt();

  try {
    const list = await callQwenCustomization<QwenVoiceListResponse>(
      {
        action: "list",
        page_size: 50,
        page_index: 0
      },
      apiKey
    );
    const existing = list.output?.voice_list?.find(
      (item) =>
        item.voice &&
        item.target_model === model &&
        (item.voice.includes(preferredName) || item.voice_prompt === prompt || item.preview_text === getQwenPreviewText())
    );
    if (existing?.voice) {
      qwenVoiceCache.set(cacheKey, existing.voice);
      return existing.voice;
    }
  } catch {
    // Listing may be unavailable for some accounts; voice creation below can still succeed.
  }

  if (process.env.AI_PET_QWEN_AUTO_CREATE_VOICE === "0") {
    throw new Error("qwen_voice_required");
  }

  const created = await callQwenCustomization<QwenVoiceCreateResponse>(
    {
      action: "create",
      target_model: model,
      voice_prompt: prompt,
      preview_text: getQwenPreviewText(),
      preferred_name: preferredName,
      language: "zh"
    },
    apiKey,
    {
      sample_rate: Number(process.env.AI_PET_QWEN_SAMPLE_RATE || 24000),
      response_format: process.env.AI_PET_QWEN_RESPONSE_FORMAT || "wav"
    }
  );
  const voice = created.output?.voice;
  if (!voice) throw new Error(created.message || created.code || "qwen_voice_create_empty");
  qwenVoiceCache.set(cacheKey, voice);
  return voice;
}

async function synthesizeWithQwen(text: string, context: AgentContextSnapshot): Promise<VoiceResult> {
  const persona = getPersonaForProfile(context.profile);
  const input = truncateAgentText(text, 600);
  const apiKey = getQwenApiKey();
  const model = getQwenTtsModel();

  if (!apiKey) {
    return {
      transcript: input,
      provider: "browser-speech-fallback",
      model: "system-speech-synthesis",
      voice: persona.tts.voice,
      warning: "qwen_api_key_missing"
    };
  }

  const voice = await resolveQwenVoice(apiKey, model);
  const response = await fetch(`${getQwenBaseUrl()}/services/aigc/multimodal-generation/generation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: {
        text: input,
        voice,
        language_type: process.env.AI_PET_QWEN_LANGUAGE_TYPE || "Chinese"
      }
    })
  });

  const raw = await response.text();
  if (!response.ok) {
    return {
      transcript: input,
      provider: "browser-speech-fallback",
      model: "system-speech-synthesis",
      voice,
      warning: trimWarning(`qwen_tts_failed_${response.status}`, raw)
    };
  }

  const data = JSON.parse(raw) as QwenAudioResponse;
  const audioData = data.output?.audio?.data;
  if (audioData) {
    return {
      transcript: input,
      provider: "qwen-tts",
      model,
      voice,
      audioBase64: audioData,
      audioContentType: "audio/wav"
    };
  }

  const audioUrl = data.output?.audio?.url;
  if (!audioUrl) {
    return {
      transcript: input,
      provider: "browser-speech-fallback",
      model: "system-speech-synthesis",
      voice,
      warning: data.message || data.code || "qwen_tts_audio_missing"
    };
  }

  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    return {
      transcript: input,
      provider: "browser-speech-fallback",
      model: "system-speech-synthesis",
      voice,
      warning: `qwen_tts_audio_download_failed_${audioResponse.status}`
    };
  }

  return {
    transcript: input,
    provider: "qwen-tts",
    model,
    voice,
    audioBase64: Buffer.from(await audioResponse.arrayBuffer()).toString("base64"),
    audioContentType: audioResponse.headers.get("content-type") || "audio/wav"
  };
}

async function synthesizeWithOpenAi(text: string, context: AgentContextSnapshot): Promise<VoiceResult> {
  const persona = getPersonaForProfile(context.profile);
  const input = truncateAgentText(text, 600);
  const apiKey = process.env.AI_PET_TTS_API_KEY || getOpenAiApiKey();
  const model = process.env.AI_PET_TTS_MODEL || "gpt-4o-mini-tts";
  const voice = process.env.AI_PET_TTS_VOICE || "coral";
  const instructions = process.env.AI_PET_TTS_INSTRUCTIONS || persona.tts.instructions;

  if (!apiKey) {
    return {
      transcript: input,
      provider: "browser-speech-fallback",
      model: "system-speech-synthesis",
      voice
    };
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      voice,
      input,
      instructions,
      response_format: "mp3"
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      transcript: input,
      provider: "browser-speech-fallback",
      model: "system-speech-synthesis",
      voice,
      warning: trimWarning(`openai_tts_failed_${response.status}`, detail)
    };
  }

  return {
    transcript: input,
    provider: "openai",
    model,
    voice,
    audioBase64: Buffer.from(await response.arrayBuffer()).toString("base64"),
    audioContentType: response.headers.get("content-type") || "audio/mpeg"
  };
}

export async function synthesizePetSpeech(text: string, context: AgentContextSnapshot): Promise<VoiceResult> {
  if (getTtsProviderPreference() === "openai") return synthesizeWithOpenAi(text, context);

  try {
    return await synthesizeWithQwen(text, context);
  } catch (error) {
    return {
      transcript: truncateAgentText(text, 600),
      provider: "browser-speech-fallback",
      model: "system-speech-synthesis",
      voice: getPersonaForProfile(context.profile).tts.voice,
      warning: error instanceof Error ? error.message : String(error)
    };
  }
}

export function getVoiceRuntimeStatus() {
  const qwenKey = getQwenApiKey();
  const openAiKey = process.env.AI_PET_TTS_API_KEY || getOpenAiApiKey();
  const preference = getTtsProviderPreference();
  if (preference === "openai") {
    return {
      provider: openAiKey ? "openai" : "browser-speech-fallback",
      configured: Boolean(openAiKey),
      model: openAiKey ? process.env.AI_PET_TTS_MODEL || "gpt-4o-mini-tts" : "system-speech-synthesis",
      voice: process.env.AI_PET_TTS_VOICE || "coral"
    };
  }

  return {
    provider: qwenKey ? "qwen-tts" : "browser-speech-fallback",
    configured: Boolean(qwenKey),
    model: qwenKey ? getQwenTtsModel() : "system-speech-synthesis",
    voice: process.env.AI_PET_QWEN_TTS_VOICE || "auto-designed"
  };
}
