import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getPersonaForProfile } from "../src/domain/agent";
import {
  createEmptySettingsOverrides,
  createMergedPetSettings,
  sanitizePersonaSettingsOverride,
  sanitizeProfileSettingsOverride,
  sanitizeSettingsOverrides,
  sanitizeVoiceSettingsOverride,
  type MergedPetSettings,
  type PetPersonaSettingsOverride,
  type PetProfileSettingsOverride,
  type PetSettingsOverrides,
  type PetVoiceSettingsOverride
} from "../src/domain/settings";
import { petProfiles } from "../src/domain/mockData";

const dataDir = process.env.AI_PET_DATA_DIR || path.join(process.cwd(), ".ai-pet-data");
const settingsFile = process.env.AI_PET_SETTINGS_FILE || path.join(dataDir, "settings.json");

function readSettingsOverrides(): PetSettingsOverrides {
  if (!existsSync(settingsFile)) return createEmptySettingsOverrides();

  try {
    return sanitizeSettingsOverrides(JSON.parse(readFileSync(settingsFile, "utf8")));
  } catch {
    return createEmptySettingsOverrides();
  }
}

function writeSettingsOverrides(overrides: PetSettingsOverrides) {
  mkdirSync(path.dirname(settingsFile), { recursive: true });
  const tmp = `${settingsFile}.tmp`;
  writeFileSync(tmp, JSON.stringify(overrides, null, 2));
  renameSync(tmp, settingsFile);
}

function compactObject<T extends object>(value: T): T | undefined {
  const compact = Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && (!Array.isArray(item) || item.length > 0))
  ) as T;
  return Object.keys(compact).length ? compact : undefined;
}

function markUpdated(overrides: PetSettingsOverrides): PetSettingsOverrides {
  return {
    ...overrides,
    version: 1,
    updatedAt: new Date().toISOString()
  };
}

function shouldReplaceSection(input: unknown) {
  return Boolean(input && typeof input === "object" && (input as Record<string, unknown>)._replace === true);
}

export function getActivePetSettings(): MergedPetSettings {
  const overrides = readSettingsOverrides();
  return createMergedPetSettings(petProfiles[0], overrides);
}

export function getActivePetProfile() {
  return getActivePetSettings().merged.profile;
}

export function getActivePetPersona() {
  const settings = getActivePetSettings();
  return getPersonaForProfile(settings.merged.profile, settings.merged.runtime);
}

export function getSettingsFilePath() {
  return settingsFile;
}

export function updateProfileSettings(input: unknown) {
  const current = readSettingsOverrides();
  const nextProfile = compactObject({
    ...(shouldReplaceSection(input) ? {} : current.profile || {}),
    ...(sanitizeProfileSettingsOverride(input) || {})
  } satisfies PetProfileSettingsOverride);
  const next = markUpdated({
    ...current,
    profile: nextProfile
  });
  writeSettingsOverrides(next);
  return getActivePetSettings();
}

export function updatePersonaSettings(input: unknown) {
  const current = readSettingsOverrides();
  const nextPersona = compactObject({
    ...(shouldReplaceSection(input) ? {} : current.persona || {}),
    ...(sanitizePersonaSettingsOverride(input) || {})
  } satisfies PetPersonaSettingsOverride);
  const next = markUpdated({
    ...current,
    persona: nextPersona
  });
  writeSettingsOverrides(next);
  return getActivePetSettings();
}

export function updateVoiceSettings(input: unknown) {
  const current = readSettingsOverrides();
  const nextVoice = compactObject({
    ...(shouldReplaceSection(input) ? {} : current.voice || {}),
    ...(sanitizeVoiceSettingsOverride(input) || {})
  } satisfies PetVoiceSettingsOverride);
  const next = markUpdated({
    ...current,
    voice: nextVoice
  });
  writeSettingsOverrides(next);
  return getActivePetSettings();
}

export function resetSettings(section?: "profile" | "persona" | "voice" | "all") {
  if (!section || section === "all") {
    const next = markUpdated(createEmptySettingsOverrides());
    writeSettingsOverrides(next);
    return getActivePetSettings();
  }

  const current = readSettingsOverrides();
  const next = markUpdated({
    ...current,
    [section]: undefined
  });
  writeSettingsOverrides(next);
  return getActivePetSettings();
}
