import { useEffect, useMemo, useRef, useState } from "react";
import type { PetAccessoryId, PetMotionAction, VirtualPetState } from "../domain/types";

export type MochiMotionId =
  | "idle"
  | "walk"
  | "jump"
  | "tail_wag"
  | "look_back"
  | "turn"
  | "sleep_laze"
  | "remind"
  | "alert"
  | "sit"
  | "wake_stretch"
  | "sniff_explore";

type MotionSpec = {
  label: string;
  fps: number;
  loop: boolean;
  frames: string[];
};

type MotionManifest = {
  defaultMotion: MochiMotionId;
  motions: Record<string, MotionSpec>;
};

type AccessoryFrameManifest = {
  frames?: string[];
};

type Props = {
  state?: Pick<VirtualPetState, "currentAnimation">;
  motionAction?: PetMotionAction;
  motion?: MochiMotionId;
  accessoryId?: PetAccessoryId;
  large?: boolean;
  className?: string;
  "aria-hidden"?: boolean;
  "aria-label"?: string;
};

const stateMotionMap: Record<VirtualPetState["currentAnimation"], MochiMotionId> = {
  idle: "idle",
  happy: "tail_wag",
  hungry: "remind",
  tired: "sleep_laze",
  dirty: "remind",
  alert: "alert",
  play: "tail_wag"
};

const actionMotionMap: Record<PetMotionAction, MochiMotionId> = {
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

let manifestPromise: Promise<MotionManifest> | undefined;
const preloadedMotionFrames = new Map<string, HTMLImageElement>();
const preloadedMotionFramePromises = new Map<string, Promise<void>>();
const accessoryManifestPromises = new Map<PetAccessoryId, Promise<Set<string>>>();

function publicAssetUrl(path: string) {
  return new URL(`assets/pets/mochi/${path}`, document.baseURI).href;
}

function loadManifest() {
  manifestPromise ||= fetch(publicAssetUrl("motions/manifest.json"), { cache: "force-cache" }).then((response) => {
    if (!response.ok) throw new Error(`motion_manifest_${response.status}`);
    return response.json() as Promise<MotionManifest>;
  });
  return manifestPromise;
}

function loadAccessoryManifest(accessoryId: PetAccessoryId) {
  if (accessoryId === "none") return Promise.resolve(new Set<string>());

  const existing = accessoryManifestPromises.get(accessoryId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const response = await fetch(publicAssetUrl(`image-edited-outfits/${accessoryId}/manifest.json`), { cache: "no-store" });
      if (!response.ok) return new Set<string>();

      const manifest = (await response.json()) as AccessoryFrameManifest;
      return new Set<string>(manifest.frames || []);
    } catch {
      return new Set<string>();
    }
  })();

  accessoryManifestPromises.set(accessoryId, promise);
  return promise;
}

function resolveMotion(state?: Pick<VirtualPetState, "currentAnimation">, action?: PetMotionAction, motion?: MochiMotionId) {
  if (action) return actionMotionMap[action] || "tail_wag";
  if (motion) return motion;
  return state?.currentAnimation ? stateMotionMap[state.currentAnimation] : "idle";
}

function accessoryFramePath(accessoryId: PetAccessoryId, frame: string) {
  return `image-edited-outfits/${accessoryId}/${frame}`;
}

function preloadMotionFrame(frame: string) {
  const cached = preloadedMotionFrames.get(frame);
  if (cached?.complete) return Promise.resolve();

  const existing = preloadedMotionFramePromises.get(frame);
  if (existing) return existing;

  const image = cached || new Image();
  preloadedMotionFrames.set(frame, image);
  const promise = new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
    if (!image.src) image.src = publicAssetUrl(frame);
  });
  preloadedMotionFramePromises.set(frame, promise);
  return promise;
}

export function MochiMotionAvatar({ state, motionAction, motion, accessoryId = "none", large, className, "aria-hidden": ariaHidden, "aria-label": ariaLabel }: Props) {
  const requestedMotion = resolveMotion(state, motionAction, motion);
  const [manifest, setManifest] = useState<MotionManifest | null>(null);
  const [accessoryFrames, setAccessoryFrames] = useState<Set<string>>(new Set());
  const [frameIndex, setFrameIndex] = useState(0);
  const [readyMotion, setReadyMotion] = useState<string>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const activeAccessoryId = accessoryId === "none" ? undefined : accessoryId;

  useEffect(() => {
    let cancelled = false;
    loadManifest()
      .then((data) => {
        if (!cancelled) setManifest(data);
      })
      .catch(() => {
        if (!cancelled) setManifest(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!activeAccessoryId) {
      setAccessoryFrames(new Set());
      return () => {
        cancelled = true;
      };
    }

    loadAccessoryManifest(activeAccessoryId).then((frames) => {
      if (!cancelled) setAccessoryFrames(frames);
    });

    return () => {
      cancelled = true;
    };
  }, [activeAccessoryId]);

  const activeMotion = useMemo(() => {
    if (!manifest) return undefined;
    return manifest.motions[requestedMotion] ? requestedMotion : manifest.defaultMotion;
  }, [manifest, requestedMotion]);

  const activeSpec = activeMotion ? manifest?.motions[activeMotion] : undefined;
  const activeMotionKey = `${activeMotion || "none"}:${activeAccessoryId || "none"}:${accessoryFrames.size}`;

  useEffect(() => {
    frameIndexRef.current = 0;
    setFrameIndex(0);
    setReadyMotion(undefined);
  }, [activeMotion, activeAccessoryId]);

  useEffect(() => {
    if (!activeMotion || !activeSpec) return;
    let cancelled = false;
    const framesToPreload = activeSpec.frames.flatMap((frame) => {
      const frames = [frame];
      if (activeAccessoryId && accessoryFrames.has(frame)) frames.push(accessoryFramePath(activeAccessoryId, frame));
      return frames;
    });

    Promise.all(framesToPreload.map(preloadMotionFrame)).then(() => {
      if (cancelled) return;
      frameIndexRef.current = 0;
      setFrameIndex(0);
      setReadyMotion(activeMotionKey);
    });

    return () => {
      cancelled = true;
    };
  }, [activeAccessoryId, activeMotion, activeMotionKey, activeSpec, accessoryFrames]);

  useEffect(() => {
    if (!activeSpec?.frames.length || readyMotion !== activeMotionKey) return;

    const spec = activeSpec;
    let raf = 0;
    let lastFrameAt = performance.now();
    let completedAt = 0;
    const frameMs = 1000 / Math.max(1, spec.fps || 8);

    function tick(now: number) {
      if (now - lastFrameAt >= frameMs) {
        lastFrameAt = now;
        const currentIndex = frameIndexRef.current;
        let nextIndex = currentIndex;

        if (currentIndex + 1 < spec.frames.length) {
          nextIndex = currentIndex + 1;
          completedAt = 0;
        } else if (spec.loop) {
          nextIndex = 0;
        } else {
          completedAt ||= now;
          if (now - completedAt > 900) {
            nextIndex = 0;
            completedAt = 0;
          }
        }

        if (nextIndex !== currentIndex) {
          frameIndexRef.current = nextIndex;
          setFrameIndex(nextIndex);
        }
      }

      raf = window.requestAnimationFrame(tick);
    }

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [activeMotionKey, activeSpec, readyMotion]);

  const canAnimate = readyMotion === activeMotionKey;
  const frame = (canAnimate ? activeSpec?.frames[frameIndex] : activeSpec?.frames[0]) || "motions/turn-v1/00.png";
  const displayFrame = activeAccessoryId && accessoryFrames.has(frame) ? accessoryFramePath(activeAccessoryId, frame) : frame;
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = preloadedMotionFrames.get(displayFrame);
    if (!canvas || !image?.complete || !image.naturalWidth || !image.naturalHeight) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;
    context.drawImage(image, x, y, width, height);
  }, [displayFrame, readyMotion]);

  const classes = ["mochi-motion-avatar", "pet-portrait", large ? "large" : "", activeMotion ? `mochi-motion-${activeMotion}` : "", className || ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-hidden={ariaHidden} aria-label={ariaHidden ? undefined : ariaLabel || "Mochi photo motion avatar"}>
      <canvas ref={canvasRef} className="mochi-motion-frame" width={520} height={520} />
    </div>
  );
}
