import {
  arbitrateMotionCommands,
  createAgentMotionCommand,
  createBraceletMirrorCommand,
  createRandomMotionCommand
} from "../src/domain/motion";
import type { ExpressionCommand, PetMotionAction, StreamPacket, VirtualPetState } from "../src/domain/types";

const commandStore: ExpressionCommand[] = [];

function upsertDefaultCommand(command: ExpressionCommand) {
  const index = commandStore.findIndex((item) => item.source === "bracelet_mirror");
  if (index >= 0) {
    commandStore[index] = command;
    return;
  }
  commandStore.push(command);
}

function compactExpiredCommands() {
  const snapshot = arbitrateMotionCommands(commandStore);
  commandStore.splice(0, commandStore.length, ...(snapshot.active ? [snapshot.active, ...snapshot.queued] : snapshot.queued));
  return snapshot;
}

export function submitMotionCommand(command: ExpressionCommand) {
  if (command.source === "bracelet_mirror") {
    upsertDefaultCommand(command);
  } else {
    commandStore.push(command);
  }
  return compactExpiredCommands();
}

export function submitBraceletMirror(packet: StreamPacket, state?: VirtualPetState) {
  return submitMotionCommand(createBraceletMirrorCommand(packet, state));
}

export function submitAgentMotion(action: PetMotionAction, reason: string, context: ExpressionCommand["context"] = {}) {
  return submitMotionCommand(createAgentMotionCommand(action, reason, context));
}

export function submitRandomMotion(reason: string) {
  return submitMotionCommand(createRandomMotionCommand(reason));
}

export function getMotionSnapshot() {
  return compactExpiredCommands();
}
