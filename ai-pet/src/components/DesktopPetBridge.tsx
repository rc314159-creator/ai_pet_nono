import { MonitorUp, Radio, RefreshCw, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "../api";
import type { DailyTask, PetProfile, StreamPacket, VirtualPetState } from "../domain/types";

type DesktopStatus = {
  configured: boolean;
  connected: boolean;
  error?: string;
  appVersion?: string;
  defaultPetVisible?: boolean;
  speechBubblesEnabled?: boolean;
  defaultPet?: {
    displayName?: string;
    builtIn?: boolean;
  };
};

type Props = {
  profile: PetProfile;
  state: VirtualPetState;
  packet: StreamPacket;
  tasks: DailyTask[];
};

export function DesktopPetBridge({ profile, state, packet, tasks }: Props) {
  const [status, setStatus] = useState<DesktopStatus | null>(null);
  const [messageState, setMessageState] = useState("checking");
  const [sending, setSending] = useState(false);
  const autoSyncedPet = useRef<string | null>(null);

  const desktopMessage = useMemo(() => buildDesktopMessage(profile, state, packet, tasks), [profile, state, packet, tasks]);

  async function refreshStatus() {
    try {
      const response = await fetch(apiUrl("/api/desktop-pet/status"));
      const data = await response.json() as DesktopStatus;
      setStatus(data);
      setMessageState(data.connected ? "connected" : "not connected");
      return data;
    } catch (error) {
      setStatus({ configured: false, connected: false, error: error instanceof Error ? error.message : String(error) });
      setMessageState("client error");
      return null;
    }
  }

  async function sendToDesktop(message = desktopMessage) {
    setSending(true);
    try {
      const response = await fetch(apiUrl("/api/desktop-pet/say"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, reaction: state.currentAnimation === "alert" ? "error" : "success" })
      });
      const data = await response.json() as { ok?: boolean; error?: string };
      setMessageState(data.ok ? "synced" : data.error || "send failed");
      await refreshStatus();
    } catch (error) {
      setMessageState(error instanceof Error ? error.message : String(error));
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  useEffect(() => {
    if (!status?.connected || autoSyncedPet.current === profile.id) return;
    autoSyncedPet.current = profile.id;
    void sendToDesktop(desktopMessage);
  }, [desktopMessage, profile.id, status?.connected]);

  const connected = Boolean(status?.connected);
  const petName = status?.defaultPet?.displayName || "OpenPets";

  return (
    <section className="panel desktop-pet-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Desktop pet</p>
          <h3>桌面宠物桥接</h3>
        </div>
        <span className={`provider-pill ${connected ? "online" : "offline"}`}>
          <Radio size={16} />
          {connected ? "connected" : "offline"}
        </span>
      </div>

      <div className="desktop-status-grid">
        <div>
          <span>运行时</span>
          <strong>{petName}</strong>
          <small>{status?.appVersion ? `OpenPets ${status.appVersion}` : status?.configured ? "等待 OpenPets" : "未配置"}</small>
        </div>
        <div>
          <span>窗口</span>
          <strong>{status?.defaultPetVisible ? "可见" : "未确认"}</strong>
          <small>{status?.speechBubblesEnabled ? "气泡开启" : "气泡状态未知"}</small>
        </div>
      </div>

      <div className="desktop-message">
        <MonitorUp size={18} />
        <p>{desktopMessage}</p>
      </div>

      {status?.defaultPet?.builtIn ? (
        <p className="desktop-note">当前连接的是 OpenPets built-in pet；Mochi 专属 pet pack 仍需下一步导入。</p>
      ) : null}
      {status?.error ? <p className="desktop-error">{status.error}</p> : null}

      <div className="desktop-actions">
        <button onClick={() => void refreshStatus()}>
          <RefreshCw size={16} />
          刷新
        </button>
        <button disabled={!connected || sending} onClick={() => void sendToDesktop()}>
          <SendHorizontal size={16} />
          {sending ? "同步中" : "同步到桌宠"}
        </button>
      </div>
      <small className="desktop-state">状态：{messageState}</small>
    </section>
  );
}

function buildDesktopMessage(profile: PetProfile, state: VirtualPetState, packet: StreamPacket, tasks: DailyTask[]) {
  const highTask = tasks.find((task) => task.priority === "high") || tasks[0];
  const flag = state.healthFlags[0] ? `提醒：${state.healthFlags[0]}` : `当前状态：${state.currentAnimation}`;
  return `${profile.name} 桌宠同步：${flag}。今日重点：${highTask?.title || "保持观察"}。设备包：${packet.activityState}，心率 ${packet.heartRateBpm}，围栏 ${packet.location.geofence}。`;
}
