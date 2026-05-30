import type { ExpressionCommand, MotionArbitrationSnapshot, PetMotionAction, StreamPacket, VirtualPetState } from "./types";

const motionPriority = {
  bracelet_mirror: 30,
  random_action: 60,
  agent_tool_call: 100
} as const;

const randomMotionPool: PetMotionAction[] = [
  "idle_happy",
  "jump",
  "look_back",
  "tail_wag",
  "sit",
  "wake_stretch",
  "sniff_explore",
  "turn",
  "remind"
];

const motionAliases: Record<string, PetMotionAction> = {
  spin: "spin",
  turn: "turn",
  "turn around": "spin",
  "roll around": "spin",
  转圈: "spin",
  转个圈: "spin",
  旋转: "spin",
  转身: "turn",
  转一下身: "turn",
  jump: "jump",
  跳: "jump",
  跳一下: "jump",
  蹦: "jump",
  sit: "sit",
  坐: "sit",
  坐下: "sit",
  趴: "sleep_laze",
  过来: "come_closer",
  靠近: "come_closer",
  come: "come_closer",
  nod: "nod",
  点头: "nod",
  回头: "look_back",
  回头看: "look_back",
  look: "look_back",
  "look back": "look_back",
  摇尾巴: "tail_wag",
  摇尾: "tail_wag",
  "tail wag": "tail_wag",
  walk: "walk",
  走: "walk",
  走路: "walk",
  play: "play",
  玩: "play",
  sleep: "sleep",
  睡: "sleep",
  睡觉: "sleep_laze",
  趴下: "sleep_laze",
  stretch: "wake_stretch",
  伸懒腰: "wake_stretch",
  起床: "wake_stretch",
  sniff: "sniff_explore",
  嗅闻: "sniff_explore",
  闻一闻: "sniff_explore",
  探索: "sniff_explore",
  remind: "remind",
  提醒: "remind",
  叫我: "remind",
  警戒: "alert",
  警惕: "alert"
};

function commandId(source: ExpressionCommand["source"], action: PetMotionAction, createdAt: string) {
  return `${source}-${action}-${createdAt.replace(/[^0-9]/g, "")}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function normalizeMotionAction(input: string): PetMotionAction | undefined {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized in motionAliases) return motionAliases[normalized];

  for (const [token, action] of Object.entries(motionAliases)) {
    if (normalized.includes(token)) return action;
  }

  return undefined;
}

export function mapDevicePacketToMotion(packet: StreamPacket, state?: VirtualPetState): PetMotionAction {
  if (packet.location.geofence === "outside_safe_zone" || packet.stressSignal === "high") return "alert";
  if (packet.scratchingSeconds >= 60) return "scratch";
  if (packet.barkingCount >= 5) return "bark";
  if (state?.energy !== undefined && state.energy < 45) return "tired_idle";

  switch (packet.activityState) {
    case "sleep":
      return "sleep_laze";
    case "walk":
      return "walk";
    case "play":
      return "play";
    case "active":
      return "idle_happy";
    case "rest":
    case "unknown":
    default:
      return "idle";
  }
}

export function createBraceletMirrorCommand(packet: StreamPacket, state?: VirtualPetState, createdAt = nowIso()): ExpressionCommand {
  const action = mapDevicePacketToMotion(packet, state);
  return {
    id: commandId("bracelet_mirror", action, createdAt),
    target: "desktop_pet",
    source: "bracelet_mirror",
    action,
    priority: motionPriority.bracelet_mirror,
    reason: `设备状态 ${packet.activityState}，压力 ${packet.stressSignal}，抓挠 ${packet.scratchingSeconds}s，吠叫 ${packet.barkingCount} 次。`,
    createdAt,
    interruptible: true,
    context: {
      evidenceEventId: packet.timestamp
    }
  };
}

export function createRandomMotionCommand(reason: string, seed = Date.now(), createdAt = nowIso()): ExpressionCommand {
  const action = randomMotionPool[Math.abs(seed) % randomMotionPool.length];
  return {
    id: commandId("random_action", action, createdAt),
    target: "desktop_pet",
    source: "random_action",
    action,
    priority: motionPriority.random_action,
    reason,
    createdAt,
    ttlMs: 3200,
    interruptible: true
  };
}

export function createAgentMotionCommand(
  action: PetMotionAction,
  reason: string,
  context: ExpressionCommand["context"] = {},
  createdAt = nowIso()
): ExpressionCommand {
  return {
    id: commandId("agent_tool_call", action, createdAt),
    target: "desktop_pet",
    source: "agent_tool_call",
    action,
    priority: motionPriority.agent_tool_call,
    reason,
    createdAt,
    ttlMs: 4200,
    interruptible: false,
    context
  };
}

export function isMotionCommandActive(command: ExpressionCommand, at = nowIso()) {
  if (!command.ttlMs) return true;
  return new Date(command.createdAt).getTime() + command.ttlMs >= new Date(at).getTime();
}

export function arbitrateMotionCommands(commands: ExpressionCommand[], at = nowIso()): MotionArbitrationSnapshot {
  const activeCommands = commands.filter((command) => isMotionCommandActive(command, at));
  const sortedEntries = activeCommands
    .map((command, index) => ({ command, index }))
    .sort((a, b) => {
      if (b.command.priority !== a.command.priority) return b.command.priority - a.command.priority;
      const createdAtDelta = new Date(b.command.createdAt).getTime() - new Date(a.command.createdAt).getTime();
      if (createdAtDelta !== 0) return createdAtDelta;
      return b.index - a.index;
    });
  const sorted = sortedEntries.map((entry) => entry.command);
  const active = sorted[0];

  return {
    active,
    queued: active ? sorted.slice(1) : [],
    suppressed: commands.filter((command) => !isMotionCommandActive(command, at)),
    generatedAt: at
  };
}
