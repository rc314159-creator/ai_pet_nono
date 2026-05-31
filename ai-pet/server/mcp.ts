import "./env";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mainThreadIdForPet } from "../src/domain/agent";
import { createAgentMotionCommand } from "../src/domain/motion";
import { compactPetSnapshot, buildPetRuntimeSnapshot } from "./petRuntimeSnapshot";
import { getActivePetSettings, updatePersonaSettings, updateProfileSettings } from "./settings";
import { appendThreadMemory } from "./threadStore";
import type { AgentMemoryFact, AgentMemoryType } from "../src/domain/agent";
import type { PetMotionAction } from "../src/domain/types";

const motionActionSchema = z.enum([
  "idle",
  "idle_happy",
  "walk",
  "play",
  "sleep",
  "sleep_laze",
  "eat",
  "scratch",
  "bark",
  "tired_idle",
  "alert",
  "jump",
  "spin",
  "turn",
  "sit",
  "come_closer",
  "nod",
  "look_back",
  "tail_wag",
  "remind",
  "wake_stretch",
  "sniff_explore"
]);

function jsonToolResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function createMemoryFact(type: AgentMemoryType, content: string): AgentMemoryFact {
  return {
    id: `memory-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    content: content.trim().slice(0, 260),
    createdAt: new Date().toISOString(),
    source: "user_explicit"
  };
}

function persistCareMemory(type: AgentMemoryType, content: string) {
  const snapshot = buildPetRuntimeSnapshot();
  const threadId = snapshot.mainThreadId || mainThreadIdForPet(snapshot.profile);
  const fact = createMemoryFact(type, content);
  appendThreadMemory(threadId, fact);
  return {
    ok: true,
    threadId,
    memory: fact,
    persistedBy: "thread-store"
  };
}

const server = new McpServer({
  name: "ai_pet",
  version: "0.1.0"
});

server.registerTool(
  "get_pet_settings",
  {
    title: "Get Pet Settings",
    description: "Read the persisted App-side pet profile, persona, owner, and runtime prompt settings.",
    inputSchema: {}
  },
  async () => jsonToolResult(getActivePetSettings())
);

server.registerTool(
  "update_pet_profile_settings",
  {
    title: "Update Pet Profile Settings",
    description: "Update persisted App-side pet profile identity settings such as display name, owner name, group name, breed, age, or weight.",
    inputSchema: {
      displayName: z.string().optional(),
      realName: z.string().optional(),
      breed: z.string().optional(),
      ageMonths: z.number().optional(),
      weightKg: z.number().optional(),
      ownerDisplayName: z.string().optional(),
      groupNameOverride: z.string().optional()
    }
  },
  async (input) => jsonToolResult(updateProfileSettings(input))
);

server.registerTool(
  "update_pet_persona_settings",
  {
    title: "Update Pet Persona Settings",
    description: "Update persisted App-side persona and system prompt supplements used by the pet agent.",
    inputSchema: {
      personalitySummary: z.string().optional(),
      speechStyleSupplement: z.string().optional(),
      promptSupplement: z.string().optional(),
      exampleDialogues: z.string().optional(),
      forbiddenPhrases: z.array(z.string()).optional(),
      proactiveLevel: z.enum(["quiet", "balanced", "chatty"]).optional(),
      responseLength: z.enum(["short", "balanced", "detailed"]).optional()
    }
  },
  async (input) => jsonToolResult(updatePersonaSettings(input))
);

server.registerTool(
  "get_pet_profile",
  {
    title: "Get Pet Profile",
    description: "Read the current real pet profile and visible AI pet identity.",
    inputSchema: {}
  },
  async () => jsonToolResult(buildPetRuntimeSnapshot().profile)
);

server.registerTool(
  "get_pet_state",
  {
    title: "Get Pet State",
    description: "Read today's health, activity, device packet, observations, inventory pressure, and pending tasks.",
    inputSchema: {}
  },
  async () => jsonToolResult(compactPetSnapshot(buildPetRuntimeSnapshot()))
);

server.registerTool(
  "get_daily_tasks",
  {
    title: "Get Daily Tasks",
    description: "Read the current pending care and companionship tasks.",
    inputSchema: {}
  },
  async () => jsonToolResult(buildPetRuntimeSnapshot().pendingTasks)
);

server.registerTool(
  "recommend_products",
  {
    title: "Recommend Products",
    description: "Return product recommendations connected to care tasks, inventory, allergies, and observed pet state.",
    inputSchema: {
      reason: z.string().optional()
    }
  },
  async ({ reason }) => {
    const snapshot = buildPetRuntimeSnapshot();
    return jsonToolResult({
      reason: reason || "care_and_inventory_context",
      items: snapshot.productRecommendations?.slice(0, 3) || []
    });
  }
);

server.registerTool(
  "request_pet_motion",
  {
    title: "Request Desktop Pet Motion",
    description:
      "Request a desktop pet motion command. Use this for explicit action requests like spin, jump, sit, come closer, nod, look back, tail wag, remind, wake stretch, or sniff explore.",
    inputSchema: {
      action: motionActionSchema,
      reason: z.string().optional()
    }
  },
  async ({ action, reason }) => {
    const snapshot = buildPetRuntimeSnapshot();
    const command = createAgentMotionCommand(action as PetMotionAction, reason || `OpenCode agent requested ${action}`, {
      targetView: "chat",
      conversationId: snapshot.mainThreadId
    });
    return jsonToolResult({
      ok: true,
      action,
      command
    });
  }
);

server.registerTool(
  "record_care_memory",
  {
    title: "Record Care Memory",
    description: "Record a user-stated pet care or relationship memory for the app adapter to persist in the main pet thread.",
    inputSchema: {
      type: z.enum(["participant_memory", "pet_memory", "event_memory", "thread_summary"]),
      content: z.string().min(1)
    }
  },
  async ({ type, content }) => jsonToolResult(persistCareMemory(type, content))
);

server.registerTool(
  "record_memory",
  {
    title: "Record Memory",
    description: "Record a long-term user, pet, event, or thread memory directly in the main pet thread store.",
    inputSchema: {
      type: z.enum(["participant_memory", "pet_memory", "event_memory", "thread_summary"]),
      content: z.string().min(1)
    }
  },
  async ({ type, content }) => jsonToolResult(persistCareMemory(type, content))
);

void server.connect(new StdioServerTransport());
