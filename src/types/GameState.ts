import type { WorkItemData, ResolvedItemRecord } from './WorkItemType';

export type EscalationPhaseName =
  | 'morning-ramp'
  | 'mid-morning'
  | 'pre-lunch'
  | 'afternoon-slump'
  | 'eod-chaos';

export interface WorkItemTypeWeight {
  type: import('./WorkItemType').WorkItemType;
  weight: number;
}

export interface EscalationPhaseConfig {
  name: EscalationPhaseName;
  startTime: number;
  endTime: number;
  maxActiveItems: number;
  spawnIntervalMs: number;
  itemTypeMix: WorkItemTypeWeight[];
}

export type TutorialStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface TutorialState {
  step: TutorialStep;
  complete: boolean;
}

export type GameOutcome = 'playing' | 'win' | 'burnout';

export interface GameState {
  phase: EscalationPhaseName;
  energy: number;
  focusMultiplier: number;
  score: number;
  backlogCount: number;
  activeItems: WorkItemData[];
  resolvedItems: ResolvedItemRecord[];
  nudgeCooldownRemaining: number;
  deepWorkActive: boolean;
  deepWorkUsesRemaining: number;
  decisionCount30s: number;
  decisionWindow30sStart: number;
  elapsedTime: number;
  outcome: GameOutcome;
  tutorialState: TutorialState;
  nudgeUseCount: number;
  attentionResidue: boolean;
  attentionResidueUntil: number;
}
