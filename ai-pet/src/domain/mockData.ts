import type { CompetitionEntry, DailySummary, DeviceBinding, InventoryItem, ManualObservation, PetProfile, Product, StreamPacket } from "./types";

const today = new Date("2026-05-29T09:00:00+08:00");

function isoAt(hour: number, minute = 0) {
  const d = new Date(today);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function day(offset: number) {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const petProfiles: PetProfile[] = [
  {
    id: "pet_mochi",
    name: "Mochi",
    displayName: "旺财",
    species: "dog",
    breed: "Pembroke Welsh Corgi",
    ageMonths: 28,
    sex: "female",
    neutered: true,
    weightKg: 12.4,
    targetWeightKg: 11.8,
    bodyConditionScore: 6,
    allergies: ["chicken"],
    conditions: ["sensitive_stomach", "seasonal_skin_itch"],
    medications: [],
    diet: {
      currentFood: "salmon sensitive stomach kibble",
      dailyGrams: 160,
      feedingWindows: ["08:00", "19:00"],
      treatLimitKcal: 70
    },
    appearance: {
      coatColor: "sable and white",
      pattern: "white chest blaze, tan eyebrows",
      earShape: "upright",
      tail: "short",
      eyeColor: "warm brown",
      distinctiveMarks: ["left shoulder white crescent", "tiny white sock on right paw"]
    },
    personality: {
      energyStyle: "短爆发型，喜欢追球但容易过度兴奋",
      sociability: "熟人热情，陌生狗谨慎",
      toyPreference: "软飞盘和嗅闻垫",
      anxietyTriggers: ["doorbell", "being home alone after sunset"]
    },
    avatar: {
      packId: "mochi-corgi-sprite-v1",
      profileImageUrl: "assets/pets/mochi/wangcai-profile-avatar-v1.png",
      palette: ["#c98d54", "#f5efe4", "#3e2a1f", "#72a67f"],
      humanForm: "短发户外少女，蜂蜜色夹克，白色围巾，圆眼睛",
      tagline: "短腿巡逻员，今天也在守护零食柜。"
    }
  },
  {
    id: "pet_luna",
    name: "Luna",
    species: "cat",
    breed: "Domestic Shorthair",
    ageMonths: 46,
    sex: "female",
    neutered: true,
    weightKg: 4.7,
    targetWeightKg: 4.5,
    bodyConditionScore: 5,
    allergies: [],
    conditions: ["hairball_prone"],
    medications: ["monthly flea prevention"],
    diet: {
      currentFood: "duck indoor cat kibble",
      dailyGrams: 58,
      feedingWindows: ["07:30", "18:30", "22:30"],
      treatLimitKcal: 35
    },
    appearance: {
      coatColor: "silver tabby",
      pattern: "mackerel stripes",
      earShape: "rounded",
      tail: "long ringed",
      eyeColor: "green",
      distinctiveMarks: ["white chin", "dark tail tip"]
    },
    personality: {
      energyStyle: "夜间活跃，白天长睡",
      sociability: "对人黏，对其它猫保持距离",
      toyPreference: "羽毛逗猫棒和纸箱",
      anxietyTriggers: ["vacuum", "carrier bag"]
    },
    avatar: {
      packId: "luna-tabby-sprite-v1",
      palette: ["#9aa6a6", "#e8ece6", "#2f3c38", "#c26b54"],
      humanForm: "银灰短发图书管理员，绿色眼睛，条纹针织衫",
      tagline: "夜间情报员，负责检查每一个纸箱。"
    }
  }
];

export const deviceBindings: DeviceBinding[] = [
  {
    provider: "fitbark_mock",
    deviceId: "FB-MOCHI-7782",
    label: "FitBark-style activity badge",
    batteryPct: 64,
    signal: "good",
    syncMode: "bluetooth",
    lastSyncAt: isoAt(8, 52),
    confidence: 0.91
  },
  {
    provider: "tractive_mock",
    deviceId: "TR-MOCHI-19A",
    label: "Tractive-style GPS & health tracker",
    batteryPct: 72,
    signal: "excellent",
    syncMode: "lte",
    lastSyncAt: isoAt(8, 58),
    confidence: 0.88
  },
  {
    provider: "petpace_mock",
    deviceId: "PP-MOCHI-VITAL-04",
    label: "PetPace-style vital collar",
    batteryPct: 59,
    signal: "good",
    syncMode: "wifi",
    lastSyncAt: isoAt(8, 55),
    confidence: 0.86
  }
];

export const dailySummaries: DailySummary[] = Array.from({ length: 14 }, (_, index) => {
  const offset = index - 13;
  const weekend = [0, 6].includes(new Date(day(offset)).getDay());
  const skinFlare = index > 10;
  const lowActivity = index === 13;
  return {
    date: day(offset),
    barkPoints: lowActivity ? 4120 : 5200 + index * 95 + (weekend ? 900 : 0),
    activityIndex: lowActivity ? 62 : 72 + (weekend ? 9 : 0) - (skinFlare ? 4 : 0),
    healthIndex: skinFlare ? 76 - (index - 10) * 2 : 84 + (index % 3),
    sleepScore: index === 12 ? 67 : index === 13 ? 71 : 78 + (index % 5),
    restMinutes: lowActivity ? 950 : 810 + (index % 4) * 22,
    activeMinutes: lowActivity ? 82 : 125 + (weekend ? 34 : 0) + index,
    playMinutes: lowActivity ? 16 : 34 + (weekend ? 18 : 0),
    caloriesKcal: lowActivity ? 462 : 520 + index * 6 + (weekend ? 60 : 0),
    distanceMeters: lowActivity ? 2380 : 3900 + index * 115 + (weekend ? 1400 : 0),
    stepsEstimate: lowActivity ? 5100 : 7600 + index * 180 + (weekend ? 2300 : 0),
    restingHeartRateBpm: skinFlare ? 78 + index % 3 : 72 + index % 4,
    restingRespirationRpm: skinFlare ? 24 : 20 + index % 3,
    skinTempC: skinFlare ? 38.4 + (index - 10) * 0.08 : 38.1 + (index % 3) * 0.04,
    scratchMinutes: skinFlare ? 18 + (index - 10) * 4 : 7 + index % 4,
    barkEvents: index === 13 ? 18 : 7 + (weekend ? 4 : 0) + index % 3,
    waterMl: index === 13 ? 370 : 480 + (index % 3) * 30,
    foodGrams: index === 13 ? 138 : 158 + (index % 2) * 5,
    stoolQuality: skinFlare ? 3 : 4,
    notes: skinFlare ? ["抓挠高于平时", "腹部有轻微红点"] : ["状态稳定"]
  };
});

const activityByHour = (hour: number): StreamPacket["activityState"] => {
  if (hour < 6) return "sleep";
  if (hour < 8) return "rest";
  if (hour < 10) return hour === 8 ? "walk" : "active";
  if (hour < 16) return hour % 3 === 0 ? "rest" : "active";
  if (hour < 19) return "play";
  if (hour < 21) return "walk";
  return "rest";
};

export const streamPackets: StreamPacket[] = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? 0 : 30;
  const activityState = activityByHour(hour);
  const active = ["active", "walk", "play"].includes(activityState);
  const scratchSpike = hour >= 6 && hour <= 9;
  return {
    timestamp: isoAt(hour, minute),
    source: index % 3 === 0 ? "fitbark_mock" : index % 3 === 1 ? "tractive_mock" : "petpace_mock",
    activityState,
    accelerometer: {
      x: active ? 0.42 + (index % 4) * 0.08 : 0.04,
      y: active ? 0.36 + (index % 5) * 0.05 : 0.02,
      z: active ? 0.82 : 0.19,
      magnitude: active ? 1.24 + (index % 6) * 0.12 : 0.24
    },
    location: {
      lat: 28.2282 + (activityState === "walk" ? index * 0.00008 : 0.00002),
      lon: 112.9388 + (activityState === "walk" ? index * 0.00006 : 0.00001),
      accuracyM: activityState === "walk" ? 12 + index % 5 : 28 + index % 9,
      geofence: hour === 20 && minute === 30 ? "outside_safe_zone" : activityState === "walk" ? "park" : "home"
    },
    heartRateBpm: active ? 96 + (index % 7) * 4 : activityState === "sleep" ? 68 + index % 3 : 76 + index % 4,
    respirationRpm: active ? 30 + index % 5 : activityState === "sleep" ? 18 + index % 2 : 22 + index % 3,
    skinTempC: scratchSpike ? 38.55 + (index % 3) * 0.04 : 38.18 + (index % 4) * 0.03,
    posture: activityState === "sleep" ? "lying_right" : activityState === "rest" ? "lying_left" : activityState === "play" ? "standing" : "sitting",
    scratchingSeconds: scratchSpike ? 90 + (index % 4) * 28 : 8 + index % 5,
    barkingCount: hour === 18 ? 8 + index % 4 : hour === 20 ? 5 : index % 2,
    stressSignal: hour === 20 && minute === 30 ? "high" : scratchSpike ? "elevated" : "normal",
    batteryPct: 76 - Math.floor(index / 3),
    signal: hour === 20 && minute === 30 ? "weak" : "good",
    confidence: hour === 20 && minute === 30 ? 0.72 : 0.86 + (index % 5) * 0.02
  };
});

export const manualObservations: ManualObservation[] = [
  {
    id: "obs_skin_001",
    category: "wound",
    severity: "watch",
    note: "腹部靠左有小片红点，Mochi 晚上舔了两次，未见渗液。",
    photoRefs: ["mock://photos/mochi-belly-redness-0529"],
    createdAt: isoAt(7, 40)
  },
  {
    id: "obs_bath_001",
    category: "bath",
    severity: "info",
    note: "上次完整洗澡 16 天前，最近只做过爪子清洁。",
    photoRefs: [],
    createdAt: isoAt(8, 10)
  },
  {
    id: "obs_appetite_001",
    category: "appetite",
    severity: "watch",
    note: "早餐剩了约 20g，精神尚可，便便成型。",
    photoRefs: [],
    createdAt: isoAt(8, 42)
  }
];

export const inventory: InventoryItem[] = [
  {
    id: "inv_food_salmon",
    category: "food",
    label: "三文鱼敏感肠胃主粮",
    quantity: 290,
    unit: "g",
    daysRemaining: 1.8,
    reorderThreshold: 3,
    petConstraints: ["no_chicken", "sensitive_stomach"]
  },
  {
    id: "inv_wipes",
    category: "cleaning",
    label: "低敏湿巾",
    quantity: 8,
    unit: "片",
    daysRemaining: 4,
    reorderThreshold: 5,
    petConstraints: ["skin_itch"]
  },
  {
    id: "inv_treat",
    category: "treat",
    label: "冻干三文鱼零食",
    quantity: 36,
    unit: "g",
    daysRemaining: 9,
    reorderThreshold: 4,
    petConstraints: ["training_reward"]
  },
  {
    id: "inv_toy_disc",
    category: "toy",
    label: "软飞盘",
    quantity: 1,
    unit: "个",
    daysRemaining: 14,
    reorderThreshold: 7,
    petConstraints: ["low_impact_play"]
  }
];

export const productCatalog: Product[] = [
  {
    id: "prod_salmon_sensitive_2kg",
    category: "food",
    title: "三文鱼低敏肠胃主粮 2kg",
    priceCny: 189,
    tags: ["salmon", "sensitive_stomach", "no_chicken", "adult_dog"],
    excludesAllergens: ["chicken"],
    fitReasons: ["主粮不足 2 天", "避开鸡肉过敏", "延续当前三文鱼蛋白来源"],
    caution: "换粮需 7 天过渡；若软便持续，停止并咨询兽医。"
  },
  {
    id: "prod_skin_wipes",
    category: "cleaning",
    title: "无香低敏宠物清洁湿巾 80 片",
    priceCny: 39,
    tags: ["skin_itch", "local_cleaning", "fragrance_free"],
    excludesAllergens: [],
    fitReasons: ["腹部红点观察中", "不建议今天完整洗澡", "适合局部清洁"],
    caution: "破皮、渗液或明显疼痛时不要反复擦拭，应就医。"
  },
  {
    id: "prod_snuffle_mat",
    category: "toy",
    title: "可水洗嗅闻垫",
    priceCny: 68,
    tags: ["low_impact_play", "anxiety", "indoor_activity"],
    excludesAllergens: [],
    fitReasons: ["今日睡眠偏低", "需要低强度活动", "Mochi 偏好嗅闻游戏"],
    caution: "使用时看护，避免啃咬布条。"
  }
];

export const competitions: CompetitionEntry[] = [
  { rank: 1, petName: "Nori", title: "晨间巡逻赛", score: 8400, metric: "步数" },
  { rank: 2, petName: "Mochi", title: "晨间巡逻赛", score: 5100, metric: "步数" },
  { rank: 3, petName: "Biscuit", title: "晨间巡逻赛", score: 4880, metric: "步数" },
  { rank: 1, petName: "Luna", title: "安静睡眠挑战", score: 91, metric: "睡眠分" },
  { rank: 2, petName: "Miso", title: "安静睡眠挑战", score: 88, metric: "睡眠分" }
];
