import Phaser from 'phaser';
import type { WorkItemData } from '../types/WorkItemType';
import type { EscalationPhaseName } from '../types/GameState';

export enum GameEvent {
  ITEM_SPAWNED = 'item_spawned',
  ITEM_RESOLVED = 'item_resolved',
  ITEM_EXPIRED = 'item_expired',
  CONTEXT_SWITCH = 'context_switch',
  DEEP_WORK_ACTIVATED = 'deep_work_activated',
  DEEP_WORK_DEACTIVATED = 'deep_work_deactivated',
  FATIGUE_PENALTY = 'fatigue_penalty',
  NUDGE_ACTIVATED = 'nudge_activated',
  ENERGY_LOW = 'energy_low',
  BURNOUT = 'burnout',
  WORKDAY_COMPLETE = 'workday_complete',
  PHASE_CHANGED = 'phase_changed',
  BACKLOG_OVERFLOW = 'backlog_overflow',
  TUTORIAL_STEP = 'tutorial_step',
  TUTORIAL_COMPLETE = 'tutorial_complete',
}

export interface ItemResolvedPayload {
  item: WorkItemData;
  action: import('../types/WorkItemType').ResolutionAction;
  score: number;
}

export interface PhaseChangedPayload {
  phase: EscalationPhaseName;
}

// Singleton EventEmitter shared across all systems in a game session.
// Re-created each time GameScene boots (call EventBus.reset() on scene shutdown).
class EventBusClass extends Phaser.Events.EventEmitter {
  constructor() {
    super();
  }

  reset(): void {
    this.removeAllListeners();
  }
}

export const EventBus = new EventBusClass();
