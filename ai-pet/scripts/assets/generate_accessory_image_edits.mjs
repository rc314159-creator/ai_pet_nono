#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const mochiRoot = path.join(root, "public", "assets", "pets", "mochi");
const reportRoot = path.resolve(root, "..", "reports", "outfit-generation-samples");

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, ".env.local"));

const accessories = {
  "acc-gps": "a blue GPS collar around the neck with a small round tracker tag under the chin",
  "acc-bell": "a soft coral collar around the neck with a small golden bell under the chin",
  "acc-medal": "a dark collar around the neck with a small golden patrol medal under the chin"
};

const sampleFrames = [
  "motions/idle-v1/000.png",
  "motions/walk-v2/10.png",
  "motions/turn-v1/10.png",
  "motions/sit-v1/10.png",
  "motions/alert-v1/10.png"
];

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);
  const valueOf = (name, fallback) => rawArgs.find((item) => item.startsWith(`${name}=`))?.split("=").slice(1).join("=") || fallback;
  return {
    all: args.has("--all"),
    publicOutput: args.has("--public-output"),
    skipExisting: !args.has("--no-skip-existing"),
    accessory: valueOf("--accessory", undefined),
    frame: valueOf("--frame", undefined),
    output: valueOf("--output", undefined),
    concurrency: Math.max(1, Number(valueOf("--concurrency", "8")) || 8),
    retries: Math.max(0, Number(valueOf("--retries", "2")) || 2),
    timeoutMs: Math.max(30_000, Number(valueOf("--timeout-ms", "240000")) || 240_000)
  };
}

function promptFor(accessoryText) {
  return [
    "Edit this exact transparent PNG frame of Mochi, the photorealistic Pembroke Welsh Corgi.",
    `Generate a new complete image of the same dog naturally wearing ${accessoryText}.`,
    "Keep the same dog identity, markings, pose, camera angle, body proportions, canvas crop, and transparent background.",
    "The accessory must be part of the generated dog image with realistic fur occlusion, lighting, perspective, and contact with the neck.",
    "Do not paste a flat graphic, do not overlay a separate sticker, and do not change the dog into a different animal.",
    "Output only the complete edited pet image."
  ].join(" ");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function editFrame({ framePath, accessoryId, accessoryText, outputRoot, timeoutMs }) {
  const baseUrl = process.env.AI_PET_IMAGE_EDIT_BASE_URL || process.env.LLMMELON_BASE_URL || "https://llmmelon.cloud/v1";
  const apiKey = process.env.AI_PET_IMAGE_EDIT_API_KEY || process.env.LLMMELON_API_KEY;
  if (!apiKey) throw new Error("AI_PET_IMAGE_EDIT_API_KEY or LLMMELON_API_KEY is required for image edits");

  const bytes = await fs.readFile(path.join(mochiRoot, framePath));
  const form = new FormData();
  form.set("model", process.env.AI_PET_IMAGE_EDIT_MODEL || "gpt-image-2");
  form.set("prompt", promptFor(accessoryText));
  form.set("size", process.env.AI_PET_IMAGE_EDIT_SIZE || "1024x1024");
  form.set("image", new Blob([bytes], { type: "image/png" }), path.basename(framePath));

  const response = await fetchWithTimeout(`${baseUrl}/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  }, timeoutMs);

  const text = await response.text();
  if (!response.ok) throw new Error(`image_edit_failed_${response.status}: ${text.slice(0, 240)}`);

  const data = JSON.parse(text);
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("image_edit_missing_b64_json");

  const output = path.join(outputRoot, accessoryId, framePath);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, Buffer.from(b64, "base64"));
  return output;
}

async function runTask(task, args, statusFile) {
  const { framePath, accessoryId, accessoryText, outputRoot } = task;
  const output = path.join(outputRoot, accessoryId, framePath);
  if (args.skipExisting && existsSync(output)) {
    await fs.appendFile(statusFile, JSON.stringify({ status: "skipped", accessoryId, framePath, output, at: new Date().toISOString() }) + "\n");
    return { status: "skipped", output };
  }

  let lastError;
  for (let attempt = 0; attempt <= args.retries; attempt += 1) {
    try {
      const written = await editFrame({ framePath, accessoryId, accessoryText, outputRoot, timeoutMs: args.timeoutMs });
      await fs.appendFile(statusFile, JSON.stringify({ status: "ok", accessoryId, framePath, output: written, attempt, at: new Date().toISOString() }) + "\n");
      return { status: "ok", output: written };
    } catch (error) {
      lastError = error;
      await fs.appendFile(statusFile, JSON.stringify({
        status: "retry",
        accessoryId,
        framePath,
        attempt,
        error: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString()
      }) + "\n");
      if (attempt < args.retries) await sleep(1500 * (attempt + 1));
    }
  }

  await fs.appendFile(statusFile, JSON.stringify({
    status: "failed",
    accessoryId,
    framePath,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    at: new Date().toISOString()
  }) + "\n");
  return { status: "failed", error: lastError };
}

async function runPool(tasks, args, statusFile) {
  let index = 0;
  const results = [];
  async function worker(workerId) {
    while (index < tasks.length) {
      const current = index;
      index += 1;
      const task = tasks[current];
      console.log(`[${current + 1}/${tasks.length}] w${workerId} ${task.accessoryId} ${task.framePath}`);
      results[current] = await runTask(task, args, statusFile);
    }
  }
  await Promise.all(Array.from({ length: Math.min(args.concurrency, tasks.length) }, (_, i) => worker(i + 1)));
  return results;
}

async function main() {
  const args = parseArgs();
  const manifest = JSON.parse(await fs.readFile(path.join(mochiRoot, "motions", "manifest.json"), "utf8"));
  const frames = args.frame ? [args.frame] : args.all ? Object.values(manifest.motions).flatMap((motion) => motion.frames) : sampleFrames;
  const selectedAccessories = args.accessory ? { [args.accessory]: accessories[args.accessory] } : accessories;

  for (const [id, text] of Object.entries(selectedAccessories)) {
    if (!text) throw new Error(`Unknown accessory: ${id}`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputRoot = args.output ? path.resolve(root, args.output) : args.publicOutput
    ? path.join(mochiRoot, "image-edited-outfits")
    : path.join(reportRoot, stamp);
  await fs.mkdir(outputRoot, { recursive: true });

  const tasks = [];
  for (const [accessoryId, accessoryText] of Object.entries(selectedAccessories)) {
    for (const framePath of frames) {
      tasks.push({ accessoryId, accessoryText, framePath, outputRoot });
    }
  }

  const runSuffix = args.accessory ? `-${args.accessory}` : "";
  const statusFile = path.join(outputRoot, `status${runSuffix}.jsonl`);
  await fs.writeFile(statusFile, "");
  console.log(`outputRoot=${outputRoot}`);
  console.log(`tasks=${tasks.length} concurrency=${args.concurrency} retries=${args.retries}`);
  const results = await runPool(tasks, args, statusFile);
  const written = results.filter((item) => item?.status === "ok" || item?.status === "skipped").map((item) => item.output);
  const failed = results.filter((item) => item?.status === "failed").length;

  await fs.writeFile(
    path.join(outputRoot, `manifest${runSuffix}.json`),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      source: `${new URL(process.env.AI_PET_IMAGE_EDIT_BASE_URL || process.env.LLMMELON_BASE_URL || "https://llmmelon.cloud/v1").hostname}-images-edits`,
      model: process.env.AI_PET_IMAGE_EDIT_MODEL || "gpt-image-2",
      frames,
      accessories: Object.keys(selectedAccessories),
      taskCount: tasks.length,
      written,
      failed
    }, null, 2)
  );
  console.log(`wrote/skipped ${written.length} image-edited frames to ${outputRoot}; failed=${failed}`);
  if (failed) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
