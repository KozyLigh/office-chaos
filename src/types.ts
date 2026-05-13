// src/types.ts — Shared TypeScript interfaces for Office Chaos

export type TaskType = 'email' | 'slack' | 'meeting' | 'client' | 'deepwork';

export interface Task {
  id: string;              // UUID
  type: TaskType;
  label: string;           // Display label (drawn from task pool in data/tasks.ts)
  urgencyLabel: string;    // 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  impactLabel: string;     // 'LOW' | 'MEDIUM' | 'HIGH'
  handleTime: number;      // ms to resolve if handled
  sanityDelta: number;     // negative = drain; positive = recover (deepwork)
  focusPoints: number;     // score awarded on handle
  deferrals: number;       // count of times deferred (escalates cost)
  isMandatory: boolean;    // true for meetings (cannot ignore)
  spawnedAt: number;       // game timestamp ms
  expiresAt?: number;      // optional auto-ignore timer
}

export interface PlayerState {
  sanity: number;           // 0–100
  focusPoints: number;      // accumulated score
  tasksHandled: number;
  tasksDeferred: number;
  tasksIgnored: number;
  meetingsSurvived: number;
  focusModeUses: number;
  lastHandledType: TaskType | null;
  contextSwitchCount: number;    // resets on 5s window
  focusModeActive: boolean;
  focusModeCooldown: number;     // ms remaining
}

export interface DayPhase {
  id: number;               // 1–6
  label: string;            // 'Morning Coffee' | ... | 'EOD Scramble'
  gameTimeStart: string;    // '08:00'
  gameTimeEnd: string;      // '09:00'
  realDurationMs: number;   // 20000 for phase 1
  maxActiveTasks: number;
  sanityDrainPerSecond: number;
  spawnIntervalMs: number;
  taskTypeWeights: Record<TaskType, number>;  // spawn probability weights
}

export interface GameResult {
  outcome: 'win' | 'burnout';
  finalSanity: number;
  finalFocusPoints: number;
  tasksHandled: number;
  tasksDeferred: number;
  tasksIgnored: number;
  survivalTimeMs: number;       // how far through the day
  focusModeUses: number;
  deepWorkCompleted: number;
}
