import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { PetAccessoryId, PetAppearanceState } from "../src/domain/types";

const accessoryLabels: Record<PetAccessoryId, string> = {
  none: "无配饰",
  "acc-gps": "定位徽章",
  "acc-bell": "提醒铃铛",
  "acc-medal": "巡逻奖章"
};

const dataDir = process.env.AI_PET_DATA_DIR || path.join(process.cwd(), ".ai-pet-data");
const appearanceFile = process.env.AI_PET_APPEARANCE_FILE || path.join(dataDir, "appearance.json");

function getMochiAssetRoot() {
  const candidates = [
    process.env.AI_PET_MOCHI_ASSET_ROOT,
    path.join(process.cwd(), "public", "assets", "pets", "mochi"),
    path.join(process.cwd(), "dist", "assets", "pets", "mochi")
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "motions", "manifest.json"))) return candidate;
  }

  return path.join(process.cwd(), "dist", "assets", "pets", "mochi");
}

type AccessoryPackStatus = {
  available: boolean;
  complete: boolean;
  frameCount: number;
  expectedFrameCount?: number;
};

function getGeneratedAccessoryPackStatus(accessoryId: PetAccessoryId): AccessoryPackStatus {
  if (accessoryId === "none") return { available: false, complete: false, frameCount: 0 };
  const manifestPath = path.join(getMochiAssetRoot(), "image-edited-outfits", accessoryId, "manifest.json");
  if (!existsSync(manifestPath)) return { available: false, complete: false, frameCount: 0 };

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      complete?: boolean;
      frameCount?: number;
      expectedFrameCount?: number;
      frames?: string[];
    };
    const frameCount = Number(manifest.frameCount || manifest.frames?.length || 0);
    return {
      available: frameCount > 0,
      complete: manifest.complete === true,
      frameCount,
      expectedFrameCount: manifest.expectedFrameCount
    };
  } catch {
    return { available: false, complete: false, frameCount: 0 };
  }
}

function buildAppearanceState(
  accessoryId: PetAccessoryId,
  petId = "pet_mochi",
  updatedAt = new Date().toISOString(),
  note?: string
): PetAppearanceState {
  const packStatus = getGeneratedAccessoryPackStatus(accessoryId);
  const assetMode = packStatus.available ? "image_edit_generated_full_frame" : "image_edit_required";

  return {
    petId,
    accessoryId,
    accessoryLabel: accessoryLabels[accessoryId],
    syncTarget: "desktop_pet",
    assetMode,
    source: "app_window",
    updatedAt,
    note: note || (accessoryId === "none" ? "当前未穿戴配饰。" : `已换上${accessoryLabels[accessoryId]}。`)
  };
}

function readAppearanceState() {
  if (!existsSync(appearanceFile)) return buildAppearanceState("none");

  try {
    const parsed = JSON.parse(readFileSync(appearanceFile, "utf8")) as Partial<PetAppearanceState>;
    if (!isPetAccessoryId(parsed.accessoryId)) return buildAppearanceState("none");
    return buildAppearanceState(
      parsed.accessoryId,
      typeof parsed.petId === "string" && parsed.petId ? parsed.petId : "pet_mochi",
      typeof parsed.updatedAt === "string" && parsed.updatedAt ? parsed.updatedAt : new Date().toISOString(),
      typeof parsed.note === "string" && parsed.note ? parsed.note : undefined
    );
  } catch {
    return buildAppearanceState("none");
  }
}

function writeAppearanceState(appearance: PetAppearanceState) {
  mkdirSync(path.dirname(appearanceFile), { recursive: true });
  const tmp = `${appearanceFile}.tmp`;
  writeFileSync(tmp, JSON.stringify(appearance, null, 2));
  renameSync(tmp, appearanceFile);
}

let currentAppearance: PetAppearanceState = readAppearanceState();

export function getDesktopPetAppearance() {
  if (existsSync(appearanceFile)) {
    currentAppearance = readAppearanceState();
  } else {
    writeAppearanceState(currentAppearance);
  }
  return currentAppearance;
}

export function isPetAccessoryId(value: unknown): value is PetAccessoryId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(accessoryLabels, value);
}

export function updateDesktopPetAppearance(accessoryId: PetAccessoryId, petId = "pet_mochi") {
  const note = accessoryId === "none" ? "已脱下配饰。" : `已换上${accessoryLabels[accessoryId]}。`;

  currentAppearance = buildAppearanceState(accessoryId, petId, new Date().toISOString(), note);
  writeAppearanceState(currentAppearance);

  return currentAppearance;
}
