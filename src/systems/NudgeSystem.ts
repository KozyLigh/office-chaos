import { EventBus, GameEvent } from './EventBus';
import { GAME_CONFIG } from '../data/gameConfig';
import type { WorkItemData } from '../types/WorkItemType';
import type { SpawnSystem } from './SpawnSystem';
import type { BacklogSystem } from './BacklogSystem';

export class NudgeSystem {
  private cooldownRemaining: number = 0;
  private useCount = 0;
  private spawnSystem: SpawnSystem;
  private backlogSystem: BacklogSystem;

  constructor(spawnSystem: SpawnSystem, backlogSystem: BacklogSystem) {
    this.spawnSystem = spawnSystem;
    this.backlogSystem = backlogSystem;
  }

  init(): void {
    this.cooldownRemaining = 0;
    this.useCount = 0;
  }

  update(deltaMs: number): void {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - deltaMs);
    }
  }

  isReady(): boolean {
    return this.cooldownRemaining <= 0;
  }

  getCooldownRemaining(): number {
    return this.cooldownRemaining;
  }

  getUseCount(): number {
    return this.useCount;
  }

  activate(): WorkItemData[] {
    if (!this.isReady()) return [];

    this.cooldownRemaining = GAME_CONFIG.NUDGE_COOLDOWN_MS;
    this.useCount++;

    // Batch resolve nudgeable active items
    const activeItems = this.spawnSystem.getActiveItems();
    const nudgeableActive = activeItems.filter((i) => i.nudgeResolvable);

    for (const item of nudgeableActive) {
      EventBus.emit(GameEvent.ITEM_RESOLVED, {
        item,
        action: 'handle',
        score: 50,
      });
    }

    // Batch resolve nudgeable backlog items
    const nudgeableBacklog = this.backlogSystem.resolveNudgeable();
    for (const item of nudgeableBacklog) {
      EventBus.emit(GameEvent.ITEM_RESOLVED, {
        item,
        action: 'handle',
        score: 25,
      });
    }

    const resolved = [...nudgeableActive, ...nudgeableBacklog];
    EventBus.emit(GameEvent.NUDGE_ACTIVATED, {
      resolvedCount: resolved.length,
      useCount: this.useCount,
    });

    return resolved;
  }
}
