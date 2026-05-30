import { Trophy } from "lucide-react";
import type { CompetitionEntry } from "../domain/types";

export function CommunityPanel({ entries }: { entries: CompetitionEntry[] }) {
  return (
    <section className="panel community-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Community hooks</p>
          <h3>社区挑战预留</h3>
        </div>
        <Trophy size={20} />
      </div>
      <div className="leaderboard">
        {entries.map((entry, index) => (
          <div key={`${entry.title}-${entry.petName}-${index}`} className={entry.petName === "Mochi" ? "leader-row self" : "leader-row"}>
            <span>#{entry.rank}</span>
            <strong>{entry.petName}</strong>
            <em>{entry.title}</em>
            <b>{entry.score} {entry.metric}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
