import type { PetProfile, Species } from "./types";

export type ResponseLengthPreference = "short" | "balanced" | "detailed";
export type ProactiveLevelPreference = "quiet" | "balanced" | "chatty";

export type PetProfileSettingsOverride = {
  displayName?: string;
  realName?: string;
  species?: Species;
  breed?: string;
  ageMonths?: number;
  weightKg?: number;
  profileImageUrl?: string;
  ownerDisplayName?: string;
  groupNameOverride?: string;
};

export type PetPersonaSettingsOverride = {
  personalitySummary?: string;
  speechStyleSupplement?: string;
  promptSupplement?: string;
  exampleDialogues?: string;
  forbiddenPhrases?: string[];
  proactiveLevel?: ProactiveLevelPreference;
  responseLength?: ResponseLengthPreference;
};

export type PetVoiceSettingsOverride = {
  voiceId?: string;
  voicePromptSupplement?: string;
  ttsSpeed?: number;
  ttsPitch?: number;
};

export type PetSettingsOverrides = {
  version: 1;
  updatedAt: string;
  profile?: PetProfileSettingsOverride;
  persona?: PetPersonaSettingsOverride;
  voice?: PetVoiceSettingsOverride;
};

export type RuntimeSettingsContext = {
  ownerDisplayName: string;
  groupName: string;
  persona?: PetPersonaSettingsOverride;
  voice?: PetVoiceSettingsOverride;
};

export type MergedPetSettings = {
  version: 1;
  updatedAt: string;
  defaults: {
    profile: PetProfile;
    ownerDisplayName: string;
  };
  overrides: PetSettingsOverrides;
  merged: {
    profile: PetProfile;
    ownerDisplayName: string;
    groupName: string;
    persona?: PetPersonaSettingsOverride;
    voice?: PetVoiceSettingsOverride;
    runtime: RuntimeSettingsContext;
  };
};

export const defaultOwnerDisplayName = "主人";

function compactText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return undefined;
  return compact.length > maxLength ? compact.slice(0, maxLength) : compact;
}

function compactMultilineText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const compact = value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!compact) return undefined;
  return compact.length > maxLength ? compact.slice(0, maxLength) : compact;
}

function numberInRange(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return undefined;
  return Math.min(max, Math.max(min, number));
}

export function createEmptySettingsOverrides(): PetSettingsOverrides {
  return {
    version: 1,
    updatedAt: new Date().toISOString()
  };
}

export function sanitizeProfileSettingsOverride(value: unknown): PetProfileSettingsOverride | undefined {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const override: PetProfileSettingsOverride = {};

  override.displayName = compactText(input.displayName, 24);
  override.realName = compactText(input.realName, 48);
  override.species = input.species === "dog" || input.species === "cat" ? input.species : undefined;
  override.breed = compactText(input.breed, 80);
  override.ageMonths = numberInRange(input.ageMonths, 0, 360);
  override.weightKg = numberInRange(input.weightKg, 0.2, 120);
  override.profileImageUrl = compactText(input.profileImageUrl, 240);
  override.ownerDisplayName = compactText(input.ownerDisplayName, 24);
  override.groupNameOverride = compactText(input.groupNameOverride, 40);

  return Object.fromEntries(Object.entries(override).filter(([, item]) => item !== undefined)) as PetProfileSettingsOverride;
}

export function sanitizePersonaSettingsOverride(value: unknown): PetPersonaSettingsOverride | undefined {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const override: PetPersonaSettingsOverride = {};

  override.personalitySummary = compactMultilineText(input.personalitySummary, 420);
  override.speechStyleSupplement = compactMultilineText(input.speechStyleSupplement, 420);
  override.promptSupplement = compactMultilineText(input.promptSupplement, 600);
  override.exampleDialogues = compactMultilineText(input.exampleDialogues, 700);
  override.forbiddenPhrases = Array.isArray(input.forbiddenPhrases)
    ? input.forbiddenPhrases.map((item) => compactText(item, 40)).filter((item): item is string => Boolean(item)).slice(0, 12)
    : typeof input.forbiddenPhrases === "string"
      ? input.forbiddenPhrases
          .split(/[,\n，、]/)
          .map((item) => compactText(item, 40))
          .filter((item): item is string => Boolean(item))
          .slice(0, 12)
      : undefined;
  override.proactiveLevel =
    input.proactiveLevel === "quiet" || input.proactiveLevel === "balanced" || input.proactiveLevel === "chatty"
      ? input.proactiveLevel
      : undefined;
  override.responseLength =
    input.responseLength === "short" || input.responseLength === "balanced" || input.responseLength === "detailed"
      ? input.responseLength
      : undefined;

  return Object.fromEntries(Object.entries(override).filter(([, item]) => item !== undefined && (!Array.isArray(item) || item.length))) as
    | PetPersonaSettingsOverride
    | undefined;
}

export function sanitizeVoiceSettingsOverride(value: unknown): PetVoiceSettingsOverride | undefined {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const override: PetVoiceSettingsOverride = {};

  override.voiceId = compactText(input.voiceId, 80);
  override.voicePromptSupplement = compactMultilineText(input.voicePromptSupplement, 420);
  override.ttsSpeed = numberInRange(input.ttsSpeed, 0.7, 1.35);
  override.ttsPitch = numberInRange(input.ttsPitch, 0.75, 1.35);

  return Object.fromEntries(Object.entries(override).filter(([, item]) => item !== undefined)) as PetVoiceSettingsOverride;
}

export function sanitizeSettingsOverrides(value: unknown): PetSettingsOverrides {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    version: 1,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
    profile: sanitizeProfileSettingsOverride(input.profile),
    persona: sanitizePersonaSettingsOverride(input.persona),
    voice: sanitizeVoiceSettingsOverride(input.voice)
  };
}

export function mergePetProfile(defaultProfile: PetProfile, profileOverride?: PetProfileSettingsOverride): PetProfile {
  const profile: PetProfile = {
    ...defaultProfile,
    diet: { ...defaultProfile.diet },
    appearance: {
      ...defaultProfile.appearance,
      distinctiveMarks: [...defaultProfile.appearance.distinctiveMarks]
    },
    personality: {
      ...defaultProfile.personality,
      anxietyTriggers: [...defaultProfile.personality.anxietyTriggers]
    },
    avatar: {
      ...defaultProfile.avatar,
      palette: [...defaultProfile.avatar.palette]
    },
    allergies: [...defaultProfile.allergies],
    conditions: [...defaultProfile.conditions],
    medications: [...defaultProfile.medications]
  };

  if (!profileOverride) return profile;

  if (profileOverride.realName) profile.name = profileOverride.realName;
  if (profileOverride.displayName) profile.displayName = profileOverride.displayName;
  if (profileOverride.species) profile.species = profileOverride.species;
  if (profileOverride.breed) profile.breed = profileOverride.breed;
  if (profileOverride.ageMonths !== undefined) profile.ageMonths = Math.round(profileOverride.ageMonths);
  if (profileOverride.weightKg !== undefined) profile.weightKg = Number(profileOverride.weightKg.toFixed(1));
  if (profileOverride.profileImageUrl) profile.avatar.profileImageUrl = profileOverride.profileImageUrl;

  return profile;
}

export function getSettingsOwnerDisplayName(settings?: PetSettingsOverrides) {
  return settings?.profile?.ownerDisplayName || defaultOwnerDisplayName;
}

export function getSettingsGroupName(profile: PetProfile, settings?: PetSettingsOverrides) {
  const displayName = profile.displayName || profile.name;
  return settings?.profile?.groupNameOverride || `${displayName}家庭群`;
}

export function createMergedPetSettings(defaultProfile: PetProfile, overrides: PetSettingsOverrides): MergedPetSettings {
  const mergedProfile = mergePetProfile(defaultProfile, overrides.profile);
  const ownerDisplayName = getSettingsOwnerDisplayName(overrides);
  const groupName = getSettingsGroupName(mergedProfile, overrides);
  const runtime: RuntimeSettingsContext = {
    ownerDisplayName,
    groupName,
    persona: overrides.persona,
    voice: overrides.voice
  };

  return {
    version: 1,
    updatedAt: overrides.updatedAt,
    defaults: {
      profile: defaultProfile,
      ownerDisplayName: defaultOwnerDisplayName
    },
    overrides,
    merged: {
      profile: mergedProfile,
      ownerDisplayName,
      groupName,
      persona: overrides.persona,
      voice: overrides.voice,
      runtime
    }
  };
}
