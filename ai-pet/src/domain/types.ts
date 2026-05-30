export type Species = "dog" | "cat";
export type ActivityState = "sleep" | "rest" | "active" | "walk" | "play" | "unknown";
export type SignalLevel = "excellent" | "good" | "weak" | "offline";
export type StressSignal = "normal" | "elevated" | "high";
export type TaskPriority = "high" | "medium" | "low";
export type PetMotionAction =
  | "idle"
  | "idle_happy"
  | "walk"
  | "play"
  | "sleep"
  | "sleep_laze"
  | "eat"
  | "scratch"
  | "bark"
  | "tired_idle"
  | "alert"
  | "jump"
  | "spin"
  | "turn"
  | "sit"
  | "come_closer"
  | "nod"
  | "look_back"
  | "tail_wag"
  | "remind"
  | "wake_stretch"
  | "sniff_explore";
export type PetMotionSource = "bracelet_mirror" | "random_action" | "agent_tool_call";
export type PetMotionPriority = 30 | 60 | 100;
export type PetAccessoryId = "none" | "acc-gps" | "acc-bell" | "acc-medal";

export type PetAppearanceState = {
  petId: string;
  accessoryId: PetAccessoryId;
  accessoryLabel: string;
  syncTarget: "desktop_pet";
  assetMode: "image_edit_required" | "image_edit_generated_full_frame";
  source: "app_window";
  updatedAt: string;
  note: string;
};

export type PetProfile = {
  id: string;
  name: string;
  displayName?: string;
  species: Species;
  breed: string;
  ageMonths: number;
  sex: "female" | "male";
  neutered: boolean;
  weightKg: number;
  targetWeightKg: number;
  bodyConditionScore: number;
  allergies: string[];
  conditions: string[];
  medications: string[];
  diet: {
    currentFood: string;
    dailyGrams: number;
    feedingWindows: string[];
    treatLimitKcal: number;
  };
  appearance: {
    coatColor: string;
    pattern: string;
    earShape: string;
    tail: string;
    eyeColor: string;
    distinctiveMarks: string[];
  };
  personality: {
    energyStyle: string;
    sociability: string;
    toyPreference: string;
    anxietyTriggers: string[];
  };
  avatar: {
    packId: string;
    profileImageUrl?: string;
    palette: string[];
    humanForm: string;
    tagline: string;
  };
};

export type DeviceBinding = {
  provider: "fitbark_mock" | "tractive_mock" | "petpace_mock";
  deviceId: string;
  label: string;
  batteryPct: number;
  signal: SignalLevel;
  syncMode: "bluetooth" | "lte" | "wifi" | "manual";
  lastSyncAt: string;
  confidence: number;
};

export type DailySummary = {
  date: string;
  barkPoints: number;
  activityIndex: number;
  healthIndex: number;
  sleepScore: number;
  restMinutes: number;
  activeMinutes: number;
  playMinutes: number;
  caloriesKcal: number;
  distanceMeters: number;
  stepsEstimate: number;
  restingHeartRateBpm: number;
  restingRespirationRpm: number;
  skinTempC: number;
  scratchMinutes: number;
  barkEvents: number;
  waterMl: number;
  foodGrams: number;
  stoolQuality: 1 | 2 | 3 | 4 | 5;
  notes: string[];
};

export type StreamPacket = {
  timestamp: string;
  source: DeviceBinding["provider"];
  activityState: ActivityState;
  accelerometer: { x: number; y: number; z: number; magnitude: number };
  location: { lat: number; lon: number; accuracyM: number; geofence: "home" | "park" | "outside_safe_zone" };
  heartRateBpm: number;
  respirationRpm: number;
  skinTempC: number;
  posture: "standing" | "lying_left" | "lying_right" | "sitting";
  scratchingSeconds: number;
  barkingCount: number;
  stressSignal: StressSignal;
  batteryPct: number;
  signal: SignalLevel;
  confidence: number;
};

export type ManualObservation = {
  id: string;
  category: "wound" | "bath" | "appetite" | "stool" | "mood" | "medication" | "grooming";
  severity: "info" | "watch" | "urgent";
  note: string;
  photoRefs: string[];
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  category: "food" | "treat" | "cleaning" | "litter" | "medicine" | "toy";
  label: string;
  quantity: number;
  unit: string;
  daysRemaining: number;
  reorderThreshold: number;
  petConstraints: string[];
};

export type Product = {
  id: string;
  category: InventoryItem["category"];
  title: string;
  priceCny: number;
  tags: string[];
  excludesAllergens: string[];
  fitReasons: string[];
  caution: string;
};

export type DailyTask = {
  id: string;
  type: "feed" | "walk" | "water" | "groom" | "bath" | "skin_check" | "rest" | "training" | "inventory" | "play";
  title: string;
  reason: string;
  priority: TaskPriority;
  dueWindow: string;
  requiresInventory: boolean;
  riskLevel: "normal" | "watch" | "vet_if_worse";
  status: "pending" | "done";
};

export type VirtualPetState = {
  fullness: number;
  mood: number;
  energy: number;
  cleanliness: number;
  friendship: number;
  hydration: number;
  fitnessTrend: number;
  currentAnimation: "idle" | "happy" | "hungry" | "tired" | "dirty" | "alert" | "play";
  healthFlags: string[];
};

export type CompetitionEntry = {
  rank: number;
  petName: string;
  title: string;
  score: number;
  metric: string;
};

export type ExpressionCommand = {
  id: string;
  target: "desktop_pet";
  source: PetMotionSource;
  action: PetMotionAction;
  priority: PetMotionPriority;
  reason: string;
  createdAt: string;
  ttlMs?: number;
  interruptible?: boolean;
  context?: {
    evidenceEventId?: string;
    messageId?: string;
    bubbleText?: string;
    conversationId?: string;
    targetView?: "chat" | "status" | "outfit" | "tasks" | "care";
  };
};

export type MotionArbitrationSnapshot = {
  active?: ExpressionCommand;
  queued: ExpressionCommand[];
  suppressed: ExpressionCommand[];
  generatedAt: string;
};
