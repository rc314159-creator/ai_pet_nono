const stage = document.querySelector("#stage");
const closeButton = document.querySelector(".close-button");
const label = document.querySelector(".mode-label");
const speech = document.querySelector(".speech");
const canvas = document.querySelector(".pet-canvas");
const ctx = canvas.getContext("2d");

const preferredMotionOrder = [
  "idle",
  "jump",
  "walk",
  "look_back",
  "turn",
  "tail_wag",
  "sit",
  "lie_down",
  "stretch",
  "alert"
];

const externalMotionMap = {
  idle: "walk",
  idle_happy: "tail_wag",
  walk: "walk",
  play: "tail_wag",
  sleep: "walk",
  eat: "tail_wag",
  scratch: "tail_wag",
  bark: "tail_wag",
  tired_idle: "walk",
  alert: "jump",
  jump: "jump",
  spin: "tail_wag",
  sit: "walk",
  come_closer: "jump",
  nod: "tail_wag"
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

const frameCache = new Map();

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
    requestAnimationFrame(tick);
  } catch (error) {
    console.error(error);
    label.textContent = "Mochi 动作包加载失败";
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
    window.desktopPhotoPet?.openAppWindow("chat");
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

  const current = manifest.motions[currentMotionId];
  stage.className = `mode-${motionId}`;
  label.textContent = `Mochi 动作帧 · ${current.label}`;
  speech.textContent = current.speech;
  replaySpeechBubble();
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
  const image = frameCache.get(framePath);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!image) return;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
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

async function pollMotionCommand() {
  if (!loaded) return;

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
    speech.textContent = command.reason || manifest.motions[motionId].speech;
    replaySpeechBubble();
  } catch {
    // The API process is optional for the standalone desktop pet demo.
  }
}
