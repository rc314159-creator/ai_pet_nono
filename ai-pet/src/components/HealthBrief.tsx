import { Droplets, Footprints, HeartPulse, Moon, Thermometer, Waves } from "lucide-react";
import type { ReactNode } from "react";
import type { DailySummary, ManualObservation, VirtualPetState } from "../domain/types";

type Props = {
  latest: DailySummary;
  state: VirtualPetState;
  observations: ManualObservation[];
};

export function HealthBrief({ latest, state, observations }: Props) {
  return (
    <section className="panel health-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Health monitor</p>
          <h3>健康与护理摘要</h3>
        </div>
        <HeartPulse size={20} />
      </div>
      <div className="health-grid">
        <HealthMetric icon={<Footprints size={18} />} label="活动指数" value={latest.activityIndex} />
        <HealthMetric icon={<Moon size={18} />} label="睡眠分" value={latest.sleepScore} />
        <HealthMetric icon={<Thermometer size={18} />} label="体温" value={latest.skinTempC.toFixed(1)} suffix="C" />
        <HealthMetric icon={<Waves size={18} />} label="抓挠" value={latest.scratchMinutes} suffix="min" />
        <HealthMetric icon={<Droplets size={18} />} label="饮水" value={latest.waterMl} suffix="ml" />
        <HealthMetric icon={<HeartPulse size={18} />} label="健康指数" value={latest.healthIndex} />
      </div>
      <div className="flag-list">
        {state.healthFlags.map((flag) => <span key={flag}>{flag}</span>)}
      </div>
      <div className="observation-list">
        {observations.map((obs) => (
          <article key={obs.id}>
            <strong>{obs.category} · {obs.severity}</strong>
            <p>{obs.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HealthMetric({ icon, label, value, suffix }: { icon: ReactNode; label: string; value: number | string; suffix?: string }) {
  return (
    <div className="health-metric">
      {icon}
      <span>{label}</span>
      <strong>{value}<small>{suffix}</small></strong>
    </div>
  );
}
