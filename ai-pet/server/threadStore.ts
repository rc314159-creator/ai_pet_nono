import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AgentChatMessage, AgentMemoryFact } from "../src/domain/agent";

type StoredThread = {
  threadId: string;
  messages: AgentChatMessage[];
  memories: AgentMemoryFact[];
  createdAt: string;
  updatedAt: string;
};

type ThreadStore = {
  version: 1;
  threads: Record<string, StoredThread>;
};

const dataDir = process.env.AI_PET_DATA_DIR || path.join(process.cwd(), ".ai-pet-data");
const storeFile = process.env.AI_PET_THREAD_STORE_FILE || path.join(dataDir, "thread-store.json");

function createEmptyStore(): ThreadStore {
  return {
    version: 1,
    threads: {}
  };
}

function readStore(): ThreadStore {
  if (!existsSync(storeFile)) return createEmptyStore();

  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as ThreadStore;
    if (parsed?.version === 1 && parsed.threads && typeof parsed.threads === "object") return parsed;
  } catch {
    // A corrupt local demo store should not prevent the app from opening.
  }

  return createEmptyStore();
}

function writeStore(store: ThreadStore) {
  mkdirSync(path.dirname(storeFile), { recursive: true });
  const tmp = `${storeFile}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2));
  renameSync(tmp, storeFile);
}

function getOrCreateThread(store: ThreadStore, threadId: string): StoredThread {
  const now = new Date().toISOString();
  store.threads[threadId] ||= {
    threadId,
    messages: [],
    memories: [],
    createdAt: now,
    updatedAt: now
  };
  return store.threads[threadId];
}

function sanitizeMessage(message: AgentChatMessage): AgentChatMessage {
  return {
    ...message,
    audioBase64: undefined,
    audioContentType: message.audioBase64 ? undefined : message.audioContentType
  };
}

export function getThreadMessages(threadId: string) {
  const store = readStore();
  return [...(store.threads[threadId]?.messages || [])];
}

export function getLatestPetThreadMessage(threadId: string) {
  const messages = getThreadMessages(threadId);
  return [...messages].reverse().find((message) => message.speaker === "pet" && message.text.trim());
}

export function appendThreadMessages(threadId: string, messages: AgentChatMessage[]) {
  const usefulMessages = messages.filter((message) => message.id && message.text.trim()).map(sanitizeMessage);
  if (!usefulMessages.length) return getThreadMessages(threadId);

  const store = readStore();
  const thread = getOrCreateThread(store, threadId);
  const seen = new Set(thread.messages.map((message) => message.id));

  for (const message of usefulMessages) {
    if (seen.has(message.id)) continue;
    thread.messages.push(message);
    seen.add(message.id);
  }

  thread.updatedAt = new Date().toISOString();
  writeStore(store);
  return [...thread.messages];
}

export function getThreadMemories(threadId: string) {
  const store = readStore();
  return [...(store.threads[threadId]?.memories || [])];
}

export function replaceThreadMemories(threadId: string, memories: AgentMemoryFact[]) {
  const store = readStore();
  const thread = getOrCreateThread(store, threadId);
  const seen = new Set<string>();
  thread.memories = memories.filter((memory) => {
    if (!memory.id || seen.has(memory.id)) return false;
    seen.add(memory.id);
    return true;
  });
  thread.updatedAt = new Date().toISOString();
  writeStore(store);
  return [...thread.memories];
}

export function appendThreadMemory(threadId: string, memory: AgentMemoryFact) {
  const store = readStore();
  const thread = getOrCreateThread(store, threadId);
  if (!thread.memories.some((item) => item.id === memory.id)) thread.memories.push(memory);
  thread.updatedAt = new Date().toISOString();
  writeStore(store);
  return [...thread.memories];
}
