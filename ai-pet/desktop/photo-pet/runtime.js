const stage = document.querySelector("#stage");
const closeButton = document.querySelector(".close-button");
const speech = document.querySelector(".speech");
const canvas = document.querySelector(".pet-canvas");
const ctx = canvas.getContext("2d");
const mainThreadId = "pet_mochi_main";
const sharedBubbleHoldMs = 8000;

const preferredMotionOrder = [
  "idle",
  "jump",
  "walk",
  "look_back",
  "turn",
  "tail_wag",
  "sit",
  "sleep_laze",
  "wake_stretch",
  "sniff_explore",
  "remind",
  "alert"
];

const externalMotionMap = {
  idle: "idle",
  idle_happy: "tail_wag",
  walk: "walk",
  play: "tail_wag",
  sleep: "sleep_laze",
  sleep_laze: "sleep_laze",
  eat: "tail_wag",
  scratch: "alert",
  bark: "alert",
  tired_idle: "sleep_laze",
  alert: "alert",
  jump: "jump",
  spin: "turn",
  turn: "turn",
  sit: "sit",
  come_closer: "jump",
  nod: "look_back",
  look_back: "look_back",
  tail_wag: "tail_wag",
  remind: "remind",
  wake_stretch: "wake_stretch",
  sniff_explore: "sniff_explore"
};

let manifest;
let assetRootUrl;
let motionOrder = preferredMotionOrder;
let motionIndex = 0;
let currentMotionId = motionOrder[motionIndex];
let currentFrameIndex = 0;
let lastFrameAt = 0;
let motionStartedAt = 0;
let motionCompletedAt = 0;
let isCurrentMotionComplete = false;
let loaded = false;
let pointerStart;
let didDrag = false;
let lastExternalCommandId = "";
let lastThreadBubbleMessageId = "";
let hasThreadBubbleWaterline = false;
let sharedBubbleText = "";
let sharedBubbleHoldUntil = 0;
let sharedBubbleHideTimer;
let currentAccessoryLabel = "无配饰";
let currentAccessoryId = "none";
let currentAssetMode = "image_edit_required";
let lastAppearanceUpdatedAt = "";

const frameCache = new Map();
const accessoryFrameCache = new Map();
const pendingAccessoryFrameLoads = new Set();
const failedAccessoryFrameLoads = new Set();
const displayedBubbleKeys = new Set(readDisplayedBubbleKeys());

closeButton.addEventListener("click", (event) => {
  event.stopPropagation();
  window.desktopPhotoPet?.close();
});

stage.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("pointerup", handlePointerUp);
window.addEventListener("pointercancel", handlePointerCancel);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") window.desktopPhotoPet?.close();
  if (event.key === "0") setMotion(motionOrder[9]);

  const n = Number(event.key);
  if (Number.isInteger(n) && n >= 1 && n <= 9) setMotion(motionOrder[n - 1]);
});

window.desktopPhotoPet?.onAppWindowClosed?.(() => {
  pollLatestThreadBubble({ immediate: true });
  pollAppearance({ force: true });
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    pollLatestThreadBubble({ immediate: true });
    pollAppearance({ force: true });
  }
});

init();

async function init() {
  try {
    const pack = await window.desktopPhotoPet.loadMotionManifest();
    manifest = pack.manifest;
    assetRootUrl = pack.assetRootUrl;
    motionOrder = preferredMotionOrder.filter((id) => manifest.motions[id]);

    for (const motionId of Object.keys(manifest.motions)) {
      if (!motionOrder.includes(motionId)) motionOrder.push(motionId);
    }

    await preloadFrames();
    loaded = true;
    setMotion(manifest.defaultMotion || motionOrder[0]);
    window.setInterval(pollMotionCommand, 900);
    window.setInterval(() => pollLatestThreadBubble(), 1600);
    window.setInterval(pollAppearance, 1100);
    pollAppearance();
    pollLatestThreadBubble({ immediate: true });
    requestAnimationFrame(tick);
  } catch (error) {
    console.error(error);
    speech.textContent = "找不到动作帧素材。";
    speech.classList.add("visible");
  }
}

function handlePointerDown(event) {
  if (event.button !== 0 || event.target === closeButton) return;
  pointerStart = {
    x: event.screenX,
    y: event.screenY
  };
  didDrag = false;
  window.desktopPhotoPet?.dragStart(pointerStart);
}

function handlePointerMove(event) {
  if (!pointerStart) return;

  const dx = event.screenX - pointerStart.x;
  const dy = event.screenY - pointerStart.y;
  if (Math.hypot(dx, dy) > 4) didDrag = true;
  if (didDrag) {
    window.desktopPhotoPet?.dragMove({
      x: event.screenX,
      y: event.screenY
    });
  }
}

function handlePointerUp() {
  if (!pointerStart) return;
  window.desktopPhotoPet?.dragEnd();
  const shouldOpen = !didDrag;
  pointerStart = undefined;
  didDrag = false;

  if (shouldOpen) {
    window.desktopPhotoPet?.openAppWindow("welcome");
  }
}

function handlePointerCancel() {
  if (!pointerStart) return;
  window.desktopPhotoPet?.dragEnd();
  pointerStart = undefined;
  didDrag = false;
}

async function preloadFrames() {
  const allFrames = Object.values(manifest.motions).flatMap((item) => item.frames);
  await Promise.all(allFrames.map((framePath) => loadImage(framePath)));
}

function loadImage(framePath) {
  const src = frameUrl(framePath);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      frameCache.set(framePath, image);
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Failed to load motion frame: ${src}`));
    image.src = src;
  });
}

function setMotion(motionId, now = performance.now()) {
  if (!motionId || !manifest.motions[motionId]) return;

  motionIndex = motionOrder.indexOf(motionId);
  currentMotionId = motionId;
  currentFrameIndex = 0;
  lastFrameAt = now;
  motionStartedAt = now;
  motionCompletedAt = 0;
  isCurrentMotionComplete = false;

  stage.className = `mode-${motionId}`;
  const activeBubble = getActiveSharedBubbleText(now);
  if (activeBubble) {
    speech.textContent = activeBubble;
    replaySpeechBubble();
  }
  warmCurrentAccessoryMotion();
  drawCurrentFrame();
}

function tick(now) {
  if (!loaded) return;

  const current = manifest.motions[currentMotionId];
  const frameMs = 1000 / current.fps;

  if (now - lastFrameAt >= frameMs) {
    lastFrameAt = now;
    advanceFrame(now);
  }

  const loopDwellMs = currentMotionId === "idle" ? 4200 : 3600;
  const holdAfterCompleteMs = 900;
  if (motionOrder.length === 1) {
    drawCurrentFrame();
    requestAnimationFrame(tick);
    return;
  }

  if (current.loop && now - motionStartedAt > loopDwellMs) {
    setMotion(nextMotionId(), now);
  } else if (!current.loop && isCurrentMotionComplete && now - motionCompletedAt > holdAfterCompleteMs) {
    setMotion(nextMotionId(), now);
  }

  drawCurrentFrame();
  requestAnimationFrame(tick);
}

function advanceFrame(now) {
  const current = manifest.motions[currentMotionId];
  currentFrameIndex += 1;

  if (currentFrameIndex < current.frames.length) return;

  if (current.loop) {
    currentFrameIndex = 0;
    return;
  }

  currentFrameIndex = current.frames.length - 1;
  if (!isCurrentMotionComplete) {
    isCurrentMotionComplete = true;
    motionCompletedAt = now;
  }
}

function drawCurrentFrame() {
  const current = manifest.motions[currentMotionId];
  const framePath = current.frames[currentFrameIndex];
  const accessoryImage = getAccessoryFrame(framePath);
  const image = accessoryImage || frameCache.get(framePath);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!image) return;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

function shouldUseAccessoryFrames() {
  return currentAccessoryId !== "none" && currentAssetMode === "image_edit_generated_full_frame";
}

function accessoryFrameKey(accessoryId, framePath) {
  return `${accessoryId}:${framePath}`;
}

function getAccessoryFrame(framePath) {
  if (!shouldUseAccessoryFrames()) return undefined;
  const key = accessoryFrameKey(currentAccessoryId, framePath);
  const image = accessoryFrameCache.get(key);
  if (image) return image;
  requestAccessoryFrame(currentAccessoryId, framePath);
  return undefined;
}

function requestAccessoryFrame(accessoryId, framePath) {
  const key = accessoryFrameKey(accessoryId, framePath);
  if (accessoryFrameCache.has(key) || pendingAccessoryFrameLoads.has(key) || failedAccessoryFrameLoads.has(key)) return;

  pendingAccessoryFrameLoads.add(key);
  const image = new Image();
  image.onload = () => {
    pendingAccessoryFrameLoads.delete(key);
    accessoryFrameCache.set(key, image);
    if (currentAccessoryId === accessoryId) drawCurrentFrame();
  };
  image.onerror = () => {
    pendingAccessoryFrameLoads.delete(key);
    failedAccessoryFrameLoads.add(key);
  };
  image.src = new URL(`image-edited-outfits/${accessoryId}/${framePath}`, assetRootUrl).href;
}

function warmCurrentAccessoryMotion() {
  if (!shouldUseAccessoryFrames()) return;
  const current = manifest.motions[currentMotionId];
  for (const framePath of current.frames) {
    requestAccessoryFrame(currentAccessoryId, framePath);
  }
}

function nextMotionId() {
  return motionOrder[(motionIndex + 1) % motionOrder.length];
}

function frameUrl(framePath) {
  return new URL(framePath, assetRootUrl).href;
}

function replaySpeechBubble() {
  speech.classList.remove("visible");
  window.requestAnimationFrame(() => speech.classList.add("visible"));
}

function getActiveSharedBubbleText(now = performance.now()) {
  return sharedBubbleText && now < sharedBubbleHoldUntil ? sharedBubbleText : "";
}

function showSharedThreadBubble(messageId, text) {
  showSpeechBubbleOnce(messageId ? `thread:${messageId}` : "", text);
  if (messageId) {
    lastThreadBubbleMessageId = messageId;
    hasThreadBubbleWaterline = true;
  }
}

function showSpeechBubbleOnce(displayKey, text) {
  if (!text) return;
  if (displayKey && displayedBubbleKeys.has(displayKey)) return;
  if (displayKey) {
    displayedBubbleKeys.add(displayKey);
    writeDisplayedBubbleKeys();
  }
  if (sharedBubbleHideTimer) {
    window.clearTimeout(sharedBubbleHideTimer);
    sharedBubbleHideTimer = undefined;
  }
  sharedBubbleText = text;
  sharedBubbleHoldUntil = performance.now() + sharedBubbleHoldMs;
  speech.textContent = text;
  replaySpeechBubble();
  sharedBubbleHideTimer = window.setTimeout(hideSharedThreadBubble, sharedBubbleHoldMs);
}

function hideSharedThreadBubble() {
  sharedBubbleText = "";
  sharedBubbleHoldUntil = 0;
  speech.classList.remove("visible");
  speech.textContent = "";
  if (sharedBubbleHideTimer) {
    window.clearTimeout(sharedBubbleHideTimer);
    sharedBubbleHideTimer = undefined;
  }
}

function readDisplayedBubbleKeys() {
  try {
    const raw = window.localStorage?.getItem("ai-pet.displayedBubbleKeys");
    const keys = JSON.parse(raw || "[]");
    return Array.isArray(keys) ? keys.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeDisplayedBubbleKeys() {
  try {
    const keys = Array.from(displayedBubbleKeys).slice(-120);
    window.localStorage?.setItem("ai-pet.displayedBubbleKeys", JSON.stringify(keys));
  } catch {
    // Desktop pet bubbles still work without localStorage persistence.
  }
}

async function pollMotionCommand() {
  if (!loaded || document.visibilityState !== "visible") return;

  try {
    const response = await fetch("http://127.0.0.1:8788/api/desktop-pet/motion", { cache: "no-store" });
    if (!response.ok) return;

    const snapshot = await response.json();
    const command = snapshot.active;
    if (!command?.id || command.id === lastExternalCommandId) return;

    lastExternalCommandId = command.id;
    const motionId = externalMotionMap[command.action] || command.action;
    if (!manifest.motions[motionId]) return;

    setMotion(motionId);
    if (command.context?.bubbleText) {
      showSharedThreadBubble(command.context.messageId, command.context.bubbleText);
    } else {
      pollLatestThreadBubble({ immediate: true });
    }
  } catch {
    // The API process is optional for the standalone desktop pet demo.
  }
}

async function pollLatestThreadBubble(options = {}) {
  if (!loaded) return;
  if (!options.immediate && document.visibilityState !== "visible") return;

  try {
    const query = new URLSearchParams({ threadId: mainThreadId });
    const response = await fetch(`http://127.0.0.1:8788/api/desktop-pet/bubble?${query.toString()}`, { cache: "no-store" });
    if (!response.ok) return;

    const snapshot = await response.json();
    const message = snapshot.message;
    if (!message?.id || !message.text) return;
    if (!hasThreadBubbleWaterline) {
      lastThreadBubbleMessageId = message.id;
      hasThreadBubbleWaterline = true;
      return;
    }
    if (displayedBubbleKeys.has(`thread:${message.id}`)) return;
    if (message.id === lastThreadBubbleMessageId) return;

    showSharedThreadBubble(message.id, message.text);
  } catch {
    // The API process is optional for the standalone desktop pet demo.
  }
}

async function pollAppearance(options = {}) {
  if (!loaded) return;

  try {
    const response = await fetch("http://127.0.0.1:8788/api/desktop-pet/appearance", { cache: "no-store" });
    if (!response.ok) return;

    const appearance = await response.json();
    if (!appearance?.updatedAt || (!options.force && appearance.updatedAt === lastAppearanceUpdatedAt)) return;

    lastAppearanceUpdatedAt = appearance.updatedAt;
    currentAccessoryLabel = appearance.accessoryLabel || "配饰";
    currentAccessoryId = appearance.accessoryId || "none";
    currentAssetMode = appearance.assetMode || "image_edit_required";
    warmCurrentAccessoryMotion();

    drawCurrentFrame();
  } catch {
    // The API process is optional for the standalone desktop pet demo.
  }
}
