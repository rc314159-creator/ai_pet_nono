import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { EventEmitter } from "node:events";
import path from "node:path";
import { computeVirtualState, currentPacket, latestDaily, planDailyTasks } from "../src/domain/engine";
import { dailySummaries, inventory, manualObservations, petProfiles, streamPackets } from "../src/domain/mockData";
import { getPetDisplayIdentity } from "../src/domain/profile";
import type { AgentChatMessage, AgentMemoryFact } from "../src/domain/agent";
import type { DailyTask, PetAccessoryId } from "../src/domain/types";

export type KnowledgeBaseSectionId = "profile" | "care" | "memory" | "events";

export type KnowledgeBaseEntry = {
  id: string;
  sectionId: KnowledgeBaseSectionId;
  title: string;
  detail: string;
  source: string;
  updatedAt: string;
  tags: string[];
  importance: "high" | "medium" | "low";
};

export type KnowledgeBaseSection = {
  id: KnowledgeBaseSectionId;
  title: string;
  summary: string;
  entries: KnowledgeBaseEntry[];
};

export type KnowledgeBaseSnapshot = {
  version: 1;
  revision: number;
  updatedAt: string;
  sections: KnowledgeBaseSection[];
};

type StoredKnowledgeBase = {
  version: 1;
  revision: number;
  updatedAt: string;
  entries: Record<string, KnowledgeBaseEntry>;
};

export type RuntimeKnowledgeBaseEvent = {
  kind: "task_completed" | "appearance_saved" | "proactive_alert" | "chat_message";
  title?: string;
  detail?: string;
  source?: string;
  tags?: string[];
  importance?: KnowledgeBaseEntry["importance"];
  task?: DailyTask;
  accessoryId?: PetAccessoryId;
  accessoryLabel?: string;
  message?: AgentChatMessage;
  threadId?: string;
};

const dataDir = process.env.AI_PET_DATA_DIR || path.join(process.cwd(), ".ai-pet-data");
const storeFile = process.env.AI_PET_KNOWLEDGE_BASE_FILE || path.join(dataDir, "knowledge-base.json");
const events = new EventEmitter();
const maxEntriesPerSection = 24;

const sectionMeta: Record<KnowledgeBaseSectionId, { title: string; summary: string }> = {
  profile: {
    title: "身份档案",
    summary: "来自 PetProfile 的宠物基础事实。"
  },
  care: {
    title: "照护证据",
    summary: "设备、观察、库存和每日任务形成的照护依据。"
  },
  memory: {
    title: "长期记忆",
    summary: "主人明确要求记住的承诺、偏好和关系事实。"
  },
  events: {
    title: "实时事件",
    summary: "对话、任务、主动提醒和桌宠同步产生的运行时事件。"
  }
};

function nowIso() {
  return new Date().toISOString();
}

function createEmptyStore(): StoredKnowledgeBase {
  return {
    version: 1,
    revision: 0,
    updatedAt: nowIso(),
    entries: {}
  };
}

function readStore(): StoredKnowledgeBase {
  if (!existsSync(storeFile)) return createEmptyStore();

  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as StoredKnowledgeBase;
    if (parsed?.version === 1 && parsed.entries && typeof parsed.entries === "object") return parsed;
  } catch {
    // A corrupt local demo knowledge base should not prevent the app from opening.
  }

  return createEmptyStore();
}

function writeStore(store: StoredKnowledgeBase) {
  mkdirSync(path.dirname(storeFile), { recursive: true });
  const tmp = `${storeFile}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2));
  renameSync(tmp, storeFile);
}

function stableEntryId(sectionId: KnowledgeBaseSectionId, id: string) {
  return `${sectionId}:${id}`;
}

function trimText(value: string, max = 260) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max - 1)}...` : compact;
}

function upsertEntries(store: StoredKnowledgeBase, entries: KnowledgeBaseEntry[]) {
  for (const entry of entries) {
    store.entries[entry.id] = entry;
  }
  pruneSectionEntries(store);
  store.revision += 1;
  store.updatedAt = nowIso();
  writeStore(store);
  emitKnowledgeBaseChange();
  return store;
}

function pruneSectionEntries(store: StoredKnowledgeBase) {
  for (const sectionId of Object.keys(sectionMeta) as KnowledgeBaseSectionId[]) {
    const sectionEntries = Object.values(store.entries)
      .filter((entry) => entry.sectionId === sectionId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    for (const entry of sectionEntries.slice(maxEntriesPerSection)) {
      delete store.entries[entry.id];
    }
  }
}

function createEntry(input: Omit<KnowledgeBaseEntry, "updatedAt"> & { updatedAt?: string }): KnowledgeBaseEntry {
  return {
    ...input,
    updatedAt: input.updatedAt || nowIso(),
    detail: trimText(input.detail, 320)
  };
}

function createDefaultEntries(): KnowledgeBaseEntry[] {
  const profile = petProfiles[0];
  const identity = getPetDisplayIdentity(profile);
  const packet = currentPacket(streamPackets, 21);
  const latest = latestDaily(dailySummaries);
  const state = computeVirtualState(profile, dailySummaries, packet, { play: 6, clean: 4 });
  const healthScore = Math.round((state.fullness + state.mood + state.energy + state.cleanliness + state.hydration + state.fitnessTrend) / 6);
  const tasks = planDailyTasks(profile, dailySummaries, state, inventory, manualObservations);
  const foodItem = inventory.find((item) => item.category === "food");
  const highTask = tasks.find((task) => task.priority === "high") || tasks[0];

  return [
    createEntry({
      id: stableEntryId("profile", "identity"),
      sectionId: "profile",
      title: `${identity.displayName} 的基础档案`,
      detail: `${profile.breed}，约 ${Math.round(profile.ageMonths / 12)} 岁，体重 ${profile.weightKg}kg。过敏源：${profile.allergies.join("、") || "暂无"}。`,
      source: "PetProfile",
      tags: ["档案", profile.species],
      importance: "high"
    }),
    createEntry({
      id: stableEntryId("profile", "diet"),
      sectionId: "profile",
      title: "饮食限制",
      detail: `${identity.displayName} 当前饮食记录：${profile.diet}。推荐和任务需要避开已知过敏源。`,
      source: "PetProfile",
      tags: ["饮食", "过敏"],
      importance: "medium"
    }),
    createEntry({
      id: stableEntryId("care", "today-state"),
      sectionId: "care",
      title: "今日状态快照",
      detail: `综合 ${healthScore}，心情 ${state.mood}，饱腹 ${state.fullness}，精力 ${state.energy}；当前活动为 ${packet.activityState}。`,
      source: "Domain State",
      tags: ["状态", latest.date],
      importance: healthScore < 75 ? "high" : "medium"
    }),
    createEntry({
      id: stableEntryId("care", "manual-observation"),
      sectionId: "care",
      title: "人工观察",
      detail: manualObservations.map((item) => `${item.category}: ${item.note}`).join("；"),
      source: "Manual Observation",
      tags: ["观察", "健康"],
      importance: "high"
    }),
    createEntry({
      id: stableEntryId("care", "inventory"),
      sectionId: "care",
      title: "库存提醒",
      detail: foodItem ? `${foodItem.label} 约剩 ${foodItem.daysRemaining} 天，低于 ${foodItem.reorderThreshold} 天阈值。` : "暂无低库存记录。",
      source: "Inventory",
      tags: ["库存", "推荐"],
      importance: foodItem && foodItem.daysRemaining <= foodItem.reorderThreshold ? "high" : "low"
    }),
    createEntry({
      id: stableEntryId("care", "top-task"),
      sectionId: "care",
      title: "今日优先任务",
      detail: highTask ? `${highTask.title}：${highTask.reason}，时间窗口 ${highTask.dueWindow}。` : "今日暂无待办任务。",
      source: "TaskPlanner",
      tags: ["任务", highTask?.priority || "low"],
      importance: highTask?.priority === "high" ? "high" : "medium"
    })
  ];
}

function ensureSeedStore() {
  const store = readStore();
  const missingDefaults = createDefaultEntries().filter((entry) => !store.entries[entry.id]);
  if (!missingDefaults.length) return store;
  for (const entry of missingDefaults) store.entries[entry.id] = entry;
  store.revision += 1;
  store.updatedAt = nowIso();
  writeStore(store);
  return store;
}

function storeToSnapshot(store: StoredKnowledgeBase): KnowledgeBaseSnapshot {
  const sections = (Object.keys(sectionMeta) as KnowledgeBaseSectionId[]).map((sectionId) => ({
    id: sectionId,
    title: sectionMeta[sectionId].title,
    summary: sectionMeta[sectionId].summary,
    entries: Object.values(store.entries)
      .filter((entry) => entry.sectionId === sectionId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }));

  return {
    version: 1,
    revision: store.revision,
    updatedAt: store.updatedAt,
    sections
  };
}

export function getKnowledgeBaseSnapshot() {
  return storeToSnapshot(ensureSeedStore());
}

export function subscribeKnowledgeBase(listener: (snapshot: KnowledgeBaseSnapshot) => void) {
  events.on("change", listener);
  return () => events.off("change", listener);
}

function emitKnowledgeBaseChange() {
  events.emit("change", getKnowledgeBaseSnapshot());
}

export function recordKnowledgeBaseMemories(threadId: string, memories: AgentMemoryFact[]) {
  if (!memories.length) return getKnowledgeBaseSnapshot();
  const store = ensureSeedStore();
  const entries = memories.map((memory) =>
    createEntry({
      id: stableEntryId("memory", memory.id),
      sectionId: "memory",
      title: memory.type === "participant_memory" ? "主人记忆" : memory.type === "pet_memory" ? "宠物设定" : memory.type === "event_memory" ? "事件记忆" : "群聊摘要",
      detail: memory.content,
      source: memory.source === "user_explicit" ? "用户明确记住" : memory.source,
      tags: [memory.type],
      importance: memory.source === "user_explicit" ? "high" : "medium",
      updatedAt: memory.createdAt
    })
  );
  return storeToSnapshot(upsertEntries(store, entries));
}

export function recordKnowledgeBaseMessages(threadId: string, messages: AgentChatMessage[]) {
  const usefulMessages = messages.filter((message) => message.text.trim());
  if (!usefulMessages.length) return getKnowledgeBaseSnapshot();
  const store = ensureSeedStore();
  const entries = usefulMessages.map((message) =>
    createEntry({
      id: stableEntryId("events", `message-${message.id}`),
      sectionId: "events",
      title: message.speaker === "user" ? "主人发起对话" : message.provider === "proactive-alert" ? "宠物主动提醒" : "宠物回复",
      detail: trimText(message.text, 220),
      source: message.provider || threadId,
      tags: ["对话", message.speaker],
      importance: message.provider === "proactive-alert" ? "high" : "medium",
      updatedAt: message.createdAt
    })
  );
  return storeToSnapshot(upsertEntries(store, entries));
}

export function recordKnowledgeBaseEvent(event: RuntimeKnowledgeBaseEvent) {
  const store = ensureSeedStore();
  const updatedAt = nowIso();
  let entry: KnowledgeBaseEntry;

  if (event.kind === "task_completed" && event.task) {
    entry = createEntry({
      id: stableEntryId("events", `task-${event.task.id}`),
      sectionId: "events",
      title: "每日任务完成",
      detail: `${event.task.title}：${event.task.reason}`,
      source: event.source || "应用窗口",
      tags: ["任务", event.task.priority],
      importance: event.task.priority === "high" ? "high" : "medium",
      updatedAt
    });
  } else if (event.kind === "appearance_saved") {
    entry = createEntry({
      id: stableEntryId("events", `appearance-${updatedAt}`),
      sectionId: "events",
      title: "桌宠配饰已同步",
      detail: `当前配饰：${event.accessoryLabel || event.accessoryId || "无配饰"}。应用窗口保存后，桌宠运行时会轮询外观状态。`,
      source: event.source || "桌宠外观 API",
      tags: ["装扮", "桌宠"],
      importance: "medium",
      updatedAt
    });
  } else if (event.kind === "proactive_alert" && event.message) {
    entry = createEntry({
      id: stableEntryId("events", `proactive-${event.message.id}`),
      sectionId: "events",
      title: "宠物主动开口",
      detail: event.message.text,
      source: event.message.provider || "主动提醒",
      tags: ["主动提醒", "对话"],
      importance: "high",
      updatedAt: event.message.createdAt
    });
  } else if (event.kind === "chat_message" && event.message) {
    return recordKnowledgeBaseMessages(event.threadId || "main-thread", [event.message]);
  } else {
    entry = createEntry({
      id: stableEntryId("events", `${event.kind}-${updatedAt}`),
      sectionId: "events",
      title: event.title || "运行时事件",
      detail: event.detail || "应用窗口产生了一条运行时事件。",
      source: event.source || "应用窗口",
      tags: event.tags || [event.kind],
      importance: event.importance || "medium",
      updatedAt
    });
  }

  return storeToSnapshot(upsertEntries(store, [entry]));
}
