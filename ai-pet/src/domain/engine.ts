import type { DailySummary, DailyTask, InventoryItem, ManualObservation, PetProfile, Product, StreamPacket, VirtualPetState } from "./types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

export function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function currentPacket(packets: StreamPacket[], tick: number) {
  return packets[tick % packets.length];
}

export function latestDaily(daily: DailySummary[]) {
  return daily[daily.length - 1];
}

export function computeVirtualState(
  profile: PetProfile,
  daily: DailySummary[],
  packet: StreamPacket,
  interactionBoosts: Partial<Record<"feed" | "play" | "clean" | "rest", number>>
): VirtualPetState {
  const latest = latestDaily(daily);
  const baselineActivity = average(daily.slice(0, -1).map((item) => item.activityIndex));
  const baselineScratch = average(daily.slice(0, -1).map((item) => item.scratchMinutes));
  const inventoryPressure = latest.foodGrams < profile.diet.dailyGrams * 0.9 ? -8 : 0;
  const activityDelta = latest.activityIndex - baselineActivity;
  const scratchHigh = latest.scratchMinutes > baselineScratch * 1.55;
  const sleepLow = latest.sleepScore < 72;
  const hydrationLow = latest.waterMl < 420;

  const fullness = clamp(58 + (latest.foodGrams / profile.diet.dailyGrams) * 28 + (interactionBoosts.feed || 0) + inventoryPressure);
  const energy = clamp(62 + (latest.sleepScore - 75) * 0.8 - (packet.stressSignal === "high" ? 10 : 0) + (interactionBoosts.rest || 0));
  const mood = clamp(70 + activityDelta * 0.55 - (scratchHigh ? 10 : 0) + (interactionBoosts.play || 0));
  const cleanliness = clamp(76 - latest.scratchMinutes * 0.8 - (scratchHigh ? 10 : 0) + (interactionBoosts.clean || 0));
  const hydration = clamp(54 + (latest.waterMl - 360) / 4);
  const fitnessTrend = clamp(70 + activityDelta * 0.8 - Math.max(0, profile.bodyConditionScore - 5) * 7);
  const friendship = clamp(46 + Object.values(interactionBoosts).reduce((sum, value) => sum + (value || 0), 0) * 0.6);

  const healthFlags: string[] = [];
  if (activityDelta < -18) healthFlags.push("activity_below_baseline");
  if (scratchHigh) healthFlags.push("scratch_above_baseline");
  if (sleepLow) healthFlags.push("sleep_quality_low");
  if (hydrationLow) healthFlags.push("water_intake_low");
  if (packet.location.geofence === "outside_safe_zone") healthFlags.push("geofence_attention");
  if (packet.stressSignal !== "normal") healthFlags.push(`stress_${packet.stressSignal}`);

  const currentAnimation: VirtualPetState["currentAnimation"] =
    healthFlags.includes("geofence_attention") || scratchHigh
      ? "alert"
      : fullness < 55
        ? "hungry"
        : energy < 55
          ? "tired"
          : cleanliness < 58
            ? "dirty"
            : (interactionBoosts.play || 0) > 0
              ? "play"
              : mood > 78
                ? "happy"
                : "idle";

  return { fullness, mood, energy, cleanliness, friendship, hydration, fitnessTrend, currentAnimation, healthFlags };
}

export function planDailyTasks(
  profile: PetProfile,
  daily: DailySummary[],
  state: VirtualPetState,
  inventory: InventoryItem[],
  observations: ManualObservation[]
): DailyTask[] {
  const latest = latestDaily(daily);
  const baselineActivity = average(daily.slice(0, -1).map((item) => item.activityIndex));
  const baselineScratch = average(daily.slice(0, -1).map((item) => item.scratchMinutes));
  const tasks: DailyTask[] = [];

  tasks.push({
    id: "task_evening_feed",
    type: "feed",
    title: `晚间按 ${profile.diet.dailyGrams / profile.diet.feedingWindows.length}g 喂食`,
    reason: `早餐剩余约 ${Math.max(0, profile.diet.dailyGrams - latest.foodGrams)}g，今天仍需稳定肠胃节奏。`,
    priority: "high",
    dueWindow: "19:00-19:30",
    requiresInventory: true,
    riskLevel: "normal",
    status: "pending"
  });

  if (latest.activityIndex < baselineActivity * 0.78) {
    tasks.push({
      id: "task_low_activity_walk",
      type: "walk",
      title: "低到中等强度遛狗 35 分钟",
      reason: `今日活动指数 ${latest.activityIndex}，低于 7 日均值 ${Math.round(baselineActivity)}，需要补足活动但避免过度奔跑。`,
      priority: "high",
      dueWindow: "17:30-20:30",
      requiresInventory: false,
      riskLevel: "normal",
      status: "pending"
    });
  }

  if (latest.sleepScore < 72) {
    tasks.push({
      id: "task_sleep_recovery",
      type: "rest",
      title: "今晚减少高强度游戏",
      reason: `昨晚睡眠分 ${latest.sleepScore}，建议用嗅闻垫替代追逐跑跳。`,
      priority: "medium",
      dueWindow: "20:30 前",
      requiresInventory: false,
      riskLevel: "normal",
      status: "pending"
    });
  }

  if (latest.scratchMinutes > baselineScratch * 1.55 || observations.some((item) => item.category === "wound")) {
    tasks.push({
      id: "task_skin_check",
      type: "skin_check",
      title: "腹部红点复查并局部清洁",
      reason: `抓挠 ${latest.scratchMinutes} 分钟，高于基线 ${Math.round(baselineScratch)} 分钟；已有红点观察记录。`,
      priority: "high",
      dueWindow: "12:00 和 21:00",
      requiresInventory: true,
      riskLevel: "vet_if_worse",
      status: "pending"
    });
  }

  if (state.hydration < 62) {
    tasks.push({
      id: "task_water",
      type: "water",
      title: "换水并观察饮水量",
      reason: `今日记录饮水 ${latest.waterMl}ml，低于平时目标；换水后观察是否主动饮水。`,
      priority: "medium",
      dueWindow: "立即",
      requiresInventory: false,
      riskLevel: "watch",
      status: "pending"
    });
  }

  for (const item of inventory) {
    if (item.daysRemaining <= item.reorderThreshold) {
      tasks.push({
        id: `task_inventory_${item.id}`,
        type: "inventory",
        title: `补货：${item.label}`,
        reason: `${item.label} 约剩 ${item.daysRemaining} 天，低于 ${item.reorderThreshold} 天阈值。`,
        priority: item.daysRemaining <= 2 ? "high" : "medium",
        dueWindow: "今天下单或加入购物车",
        requiresInventory: true,
        riskLevel: "normal",
        status: "pending"
      });
    }
  }

  return tasks.slice(0, 7);
}

export function recommendProducts(profile: PetProfile, tasks: DailyTask[], inventory: InventoryItem[], products: Product[]) {
  const needCategories = new Set<InventoryItem["category"]>();
  inventory.filter((item) => item.daysRemaining <= item.reorderThreshold).forEach((item) => needCategories.add(item.category));
  if (tasks.some((task) => task.type === "skin_check")) needCategories.add("cleaning");
  if (tasks.some((task) => task.type === "rest" || task.type === "play")) needCategories.add("toy");

  return products
    .filter((product) => needCategories.has(product.category))
    .map((product) => {
      const blocked = profile.allergies.filter((allergen) => !product.excludesAllergens.includes(allergen) && product.tags.includes(allergen));
      return {
        ...product,
        compatible: blocked.length === 0,
        decisionReason: blocked.length
          ? `排除：可能包含 ${blocked.join(", ")}`
          : `${product.fitReasons.join("；")}。已检查过敏：${profile.allergies.length ? profile.allergies.join(", ") : "无记录"}。`
      };
    })
    .filter((product) => product.compatible);
}

export function buildAdvisorContext(
  profile: PetProfile,
  state: VirtualPetState,
  latest: DailySummary,
  tasks: DailyTask[],
  inventory: InventoryItem[],
  packet: StreamPacket
) {
  return {
    pet: {
      name: profile.name,
      species: profile.species,
      breed: profile.breed,
      ageMonths: profile.ageMonths,
      weightKg: profile.weightKg,
      targetWeightKg: profile.targetWeightKg,
      allergies: profile.allergies,
      conditions: profile.conditions,
      diet: profile.diet,
      personality: profile.personality
    },
    virtualState: state,
    latestDailySummary: latest,
    currentDevicePacket: packet,
    pendingTasks: tasks.filter((task) => task.status === "pending"),
    inventory
  };
}
