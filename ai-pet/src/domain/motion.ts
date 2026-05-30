import type { ExpressionCommand, MotionArbitrationSnapshot, PetMotionAction, StreamPacket, VirtualPetState } from "./types";

const motionPriority = {
  bracelet_mirror: 30,
  random_action: 60,
  agent_tool_call: 100
} as const;

const randomMotionPool: PetMotionAction[] = ["idle_happy", "jump", "nod", "play", "sit"];

const motionAliases: Record<string, PetMotionAction> = {
  spin: "spin",
  "turn around": "spin",
  "roll around": "spin",
  转圈: "spin",
  转个圈: "spin",
  旋转: "spin",
  jump: "jump",
  跳: "jump",
  跳一下: "jump",
  蹦: "jump",
  sit: "sit",
  坐: "sit",
  坐下: "sit",
  过来: "come_closer",
  靠近: "come_closer",
  come: "come_closer",
  nod: "nod",
  点头: "nod",
  walk: "walk",
  走: "walk",
  走路: "walk",
  play: "play",
  玩: "play",
  sleep: "sleep",
  睡: "sleep",
  趴下: "sleep"
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
      return "sleep";
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
  const sorted = [...activeCommands].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const active = sorted[0];

  return {
    active,
    queued: active ? sorted.slice(1) : [],
    suppressed: commands.filter((command) => !isMotionCommandActive(command, at)),
    generatedAt: at
  };
}
