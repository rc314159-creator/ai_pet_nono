import { Activity, BatteryMedium, MapPin, Radio, Thermometer } from "lucide-react";
import type { ReactNode } from "react";
import type { DailySummary, DeviceBinding, StreamPacket } from "../domain/types";

type Props = {
  bindings: DeviceBinding[];
  packet: StreamPacket;
  daily: DailySummary[];
  bound: boolean;
  onBoundChange: (value: boolean) => void;
};

export function DeviceStream({ bindings, packet, daily, bound, onBoundChange }: Props) {
  const recent = daily.slice(-7);
  return (
    <section className="panel device-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Mock collar stream</p>
          <h3>仿硬件设备数据</h3>
        </div>
        <label className="switch">
          <input type="checkbox" checked={bound} onChange={(event) => onBoundChange(event.target.checked)} />
          <span />
          绑定
        </label>
      </div>

      <div className="device-grid">
        {bindings.map((binding) => (
          <div key={binding.deviceId} className="device-card">
            <Radio size={16} />
            <strong>{binding.label}</strong>
            <span>{binding.deviceId}</span>
            <small>{binding.syncMode} · {binding.signal} · {binding.confidence.toFixed(2)}</small>
          </div>
        ))}
      </div>

      <div className="packet-grid">
        <Metric icon={<Activity size={17} />} label="状态" value={packet.activityState} />
        <Metric icon={<HeartIcon />} label="心率" value={`${packet.heartRateBpm} bpm`} />
        <Metric icon={<Thermometer size={17} />} label="体表温" value={`${packet.skinTempC.toFixed(1)} C`} />
        <Metric icon={<BatteryMedium size={17} />} label="电量" value={`${packet.batteryPct}%`} />
        <Metric icon={<MapPin size={17} />} label="围栏" value={packet.location.geofence} />
        <Metric icon={<Radio size={17} />} label="压力" value={packet.stressSignal} />
      </div>

      <div className="trend-chart" aria-label="7 日趋势">
        {recent.map((item) => (
          <div key={item.date} className="trend-day">
            <span style={{ height: `${item.activityIndex}%` }} />
            <b>{item.date.slice(5)}</b>
          </div>
        ))}
      </div>
      <div className="packet-json">
        <code>{JSON.stringify({
          ts: packet.timestamp,
          source: packet.source,
          accel: packet.accelerometer,
          location: packet.location,
          scratchSec: packet.scratchingSeconds,
          bark: packet.barkingCount,
          confidence: packet.confidence
        }, null, 2)}</code>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metric-tile">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HeartIcon() {
  return <span className="heart-dot" />;
}
