import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import type { DailyTask } from "../domain/types";

type Props = {
  tasks: DailyTask[];
  completed: Set<string>;
  onToggle: (taskId: string) => void;
};

export function TaskBoard({ tasks, completed, onToggle }: Props) {
  return (
    <section className="panel task-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Daily care plan</p>
          <h3>今日任务清单</h3>
        </div>
        <span className="count-pill">{completed.size}/{tasks.length}</span>
      </div>
      <div className="task-list">
        {tasks.map((task) => {
          const done = completed.has(task.id);
          return (
            <button key={task.id} className={`task-item ${done ? "done" : ""} ${task.priority}`} onClick={() => onToggle(task.id)}>
              <span className="task-status">{done ? <CheckCircle2 size={20} /> : <Clock3 size={20} />}</span>
              <span className="task-copy">
                <strong>{task.title}</strong>
                <small>{task.reason}</small>
                <em>{task.dueWindow} · {task.priority}</em>
              </span>
              {task.riskLevel !== "normal" && <ShieldAlert className="risk-icon" size={18} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
