import type { WorkItemData, WorkItemType, PriorityTier } from '../types/WorkItemType';
import { WORK_ITEM_TEMPLATES } from '../data/workItems';
import { GAME_CONFIG } from '../data/gameConfig';

let _nextId = 1;

function generateId(): string {
  return `wi-${_nextId++}`;
}

/** Reset id counter (for tests) */
export function resetWorkItemIdCounter(): void {
  _nextId = 1;
}

const TIER_COLOR: Record<PriorityTier, string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#fb923c',
  critical: '#f87171',
  trap: '#c084fc',
};

export function tierColor(tier: PriorityTier): string {
  return TIER_COLOR[tier];
}

const TYPE_ICON: Record<WorkItemType, string> = {
  slack: '💬',
  email: '✉️',
  calendar: '📅',
  client: '⚠️',
  p0: '🚨',
  sync: '🔄',
  'per-my-last': '📝',
};

export function typeIcon(type: WorkItemType): string {
  return TYPE_ICON[type];
}

/**
 * Factory: create a WorkItemData from a template type.
 * Picks a matching template at random if multiple exist.
 */
export function createWorkItemData(
  type: WorkItemType,
  spawnedAt: number
): WorkItemData {
  const candidates = WORK_ITEM_TEMPLATES.filter((t) => t.type === type);
  if (candidates.length === 0) {
    throw new Error(`No template found for type: ${type}`);
  }
  const template = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    id: generateId(),
    type: template.type,
    priorityTier: template.priorityTier,
    label: template.label,
    subtext: template.subtext,
    energyCost: template.energyCost,
    timeWindow: template.timeWindow,
    isFalseUrgency: template.isFalseUrgency,
    spawnedAt,
    cascadeTrigger: template.cascadeTrigger,
    nudgeResolvable: template.nudgeResolvable,
  };
}

/**
 * Object pool for WorkItemData. Pre-allocates WORK_ITEM_POOL_SIZE slots.
 * Avoids per-spawn allocation during gameplay.
 */
export class WorkItemPool {
  private pool: (WorkItemData | null)[];
  private readonly size: number;

  constructor(size: number = GAME_CONFIG.WORK_ITEM_POOL_SIZE) {
    this.size = size;
    this.pool = new Array<WorkItemData | null>(size).fill(null);
  }

  acquire(type: WorkItemType, spawnedAt: number): WorkItemData | null {
    for (let i = 0; i < this.size; i++) {
      if (this.pool[i] === null) {
        const item = createWorkItemData(type, spawnedAt);
        this.pool[i] = item;
        return item;
      }
    }
    return null; // pool exhausted
  }

  release(id: string): void {
    for (let i = 0; i < this.size; i++) {
      if (this.pool[i]?.id === id) {
        this.pool[i] = null;
        return;
      }
    }
  }

  activeCount(): number {
    return this.pool.filter((p) => p !== null).length;
  }

  reset(): void {
    this.pool.fill(null);
  }
}
