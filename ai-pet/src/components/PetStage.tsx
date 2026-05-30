import { BadgeCheck, HeartPulse, Sparkles, UserRound } from "lucide-react";
import type { CSSProperties } from "react";
import type { PetProfile, StreamPacket, VirtualPetState } from "../domain/types";

type Props = {
  profile: PetProfile;
  state: VirtualPetState;
  packet: StreamPacket;
  bound: boolean;
  onInteract: (action: "feed" | "play" | "clean" | "rest") => void;
};

export function PetStage({ profile, state, packet, bound, onInteract }: Props) {
  const palette = profile.avatar.palette;
  const isDog = profile.species === "dog";
  return (
    <section className="stage-panel">
      <div className="stage-header">
        <div>
          <p className="eyebrow">Digital twin</p>
          <h2>{profile.name}</h2>
          <p>{profile.breed} · {profile.ageMonths} 个月 · BCS {profile.bodyConditionScore}/9</p>
        </div>
        <span className={`live-pill ${bound ? "on" : ""}`}>
          <BadgeCheck size={16} />
          {bound ? "设备绑定中" : "手动模式"}
        </span>
      </div>

      <div className="avatar-lab">
        <div className={`pet-figure ${state.currentAnimation}`} style={{ "--fur": palette[0], "--cream": palette[1], "--ink": palette[2] } as CSSProperties}>
          <div className="pet-shadow" />
          <div className="tail" />
          <div className="body">
            <div className="mark" />
          </div>
          <div className="head">
            <div className="ear left" />
            <div className="ear right" />
            <div className="eye left" />
            <div className="eye right" />
            <div className="muzzle" />
            <div className="nose" />
            {isDog ? <div className="tongue" /> : <div className="whiskers" />}
          </div>
          <div className="leg a" />
          <div className="leg b" />
        </div>

        <div className="human-card">
          <UserRound size={20} />
          <strong>拟人形象</strong>
          <span>{profile.avatar.humanForm}</span>
        </div>
      </div>

      <div className="pet-quote">
        <Sparkles size={18} />
        <span>{profile.avatar.tagline}</span>
      </div>

      <div className="state-strip">
        <StateChip label="饱腹" value={state.fullness} />
        <StateChip label="心情" value={state.mood} />
        <StateChip label="精力" value={state.energy} />
        <StateChip label="清洁" value={state.cleanliness} />
        <StateChip label="补水" value={state.hydration} />
      </div>

      <div className="interaction-row">
        <button onClick={() => onInteract("feed")}>喂食</button>
        <button onClick={() => onInteract("play")}>玩玩具</button>
        <button onClick={() => onInteract("clean")}>局部护理</button>
        <button onClick={() => onInteract("rest")}>休息</button>
      </div>

      <div className="packet-note">
        <HeartPulse size={16} />
        <span>当前包：{packet.activityState} · HR {packet.heartRateBpm} · RR {packet.respirationRpm} · {packet.location.geofence}</span>
      </div>
    </section>
  );
}

function StateChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="state-chip">
      <span>{label}</span>
      <strong>{value}</strong>
      <i style={{ width: `${value}%` }} />
    </div>
  );
}
