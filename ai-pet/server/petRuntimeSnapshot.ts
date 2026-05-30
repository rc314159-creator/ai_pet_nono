import { computeVirtualState, currentPacket, latestDaily, planDailyTasks, recommendProducts } from "../src/domain/engine";
import { dailySummaries, inventory, manualObservations, petProfiles, productCatalog, streamPackets } from "../src/domain/mockData";
import { mainThreadIdForPet } from "../src/domain/agent";
import type { AgentContextSnapshot } from "../src/domain/agent";

export function buildPetRuntimeSnapshot(tick = Math.floor(Date.now() / 30_000)): AgentContextSnapshot {
  const profile = petProfiles[0];
  const packet = currentPacket(streamPackets, tick);
  const latest = latestDaily(dailySummaries);
  const state = computeVirtualState(profile, dailySummaries, packet, {});
  const pendingTasks = planDailyTasks(profile, dailySummaries, state, inventory, manualObservations);
  const productRecommendations = recommendProducts(profile, pendingTasks, inventory, productCatalog);

  return {
    profile,
    state,
    latestDailySummary: latest,
    currentDevicePacket: packet,
    pendingTasks,
    inventory,
    manualObservations,
    productRecommendations,
    mainThreadId: mainThreadIdForPet(profile)
  };
}

export function compactPetSnapshot(snapshot: AgentContextSnapshot) {
  return {
    profile: {
      id: snapshot.profile.id,
      name: snapshot.profile.name,
      displayName: snapshot.profile.displayName,
      species: snapshot.profile.species,
      breed: snapshot.profile.breed,
      ageMonths: snapshot.profile.ageMonths,
      weightKg: snapshot.profile.weightKg,
      allergies: snapshot.profile.allergies,
      conditions: snapshot.profile.conditions,
      diet: snapshot.profile.diet,
      personality: snapshot.profile.personality,
      appearance: snapshot.profile.appearance
    },
    state: snapshot.state,
    latestDailySummary: snapshot.latestDailySummary,
    currentDevicePacket: snapshot.currentDevicePacket,
    pendingTasks: snapshot.pendingTasks.slice(0, 5),
    lowInventory: snapshot.inventory.filter((item) => item.daysRemaining <= item.reorderThreshold),
    manualObservations: snapshot.manualObservations,
    productRecommendations: snapshot.productRecommendations?.slice(0, 3),
    selectedOutfit: snapshot.selectedOutfit,
    mainThreadId: snapshot.mainThreadId
  };
}
