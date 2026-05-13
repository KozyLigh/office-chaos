import { EventBus, GameEvent } from './EventBus';
import { WorkItemPool } from '../objects/WorkItem';
import { ESCALATION_PHASES } from '../data/phases';
import type { EscalationPhaseConfig, EscalationPhaseName, WorkItemTypeWeight } from '../types/GameState';
import type { WorkItemData, WorkItemType } from '../types/WorkItemType';

export class SpawnSystem {
  private pool: WorkItemPool;
  private activeItems: WorkItemData[] = [];
  private currentPhaseIndex = 0;
  private spawnTimer = 0;
  private elapsedMs = 0;
  private paused = false;

  constructor(pool: WorkItemPool) {
    this.pool = pool;
  }

  init(): void {
    this.currentPhaseIndex = 0;
    this.spawnTimer = 0;
    this.elapsedMs = 0;
    this.activeItems = [];
    this.paused = false;

    EventBus.on(GameEvent.ITEM_RESOLVED, this.onItemResolved, this);
    EventBus.on(GameEvent.ITEM_EXPIRED, this.onItemExpired, this);
    EventBus.on(GameEvent.DEEP_WORK_ACTIVATED, () => { this.paused = true; });
    EventBus.on(GameEvent.DEEP_WORK_DEACTIVATED, () => { this.paused = false; });
  }

  destroy(): void {
    EventBus.off(GameEvent.ITEM_RESOLVED, this.onItemResolved, this);
    EventBus.off(GameEvent.ITEM_EXPIRED, this.onItemExpired, this);
  }

  update(deltaMs: number): void {
    if (this.paused) return;

    this.elapsedMs += deltaMs;
    const elapsedSec = this.elapsedMs / 1000;

    // Advance phase
    const newPhaseIndex = this.resolvePhaseIndex(elapsedSec);
    if (newPhaseIndex !== this.currentPhaseIndex) {
      this.currentPhaseIndex = newPhaseIndex;
      const phase = this.currentPhase();
      EventBus.emit(GameEvent.PHASE_CHANGED, { phase: phase.name });
      this.spawnTimer = 0; // reset timer on phase change
    }

    // Tick spawn timer
    this.spawnTimer += deltaMs;
    const phase = this.currentPhase();

    if (
      this.spawnTimer >= phase.spawnIntervalMs &&
      this.activeItems.length < phase.maxActiveItems
    ) {
      this.spawnTimer = 0;
      this.spawnItem(phase);
    }

    // Check item expiry
    for (const item of [...this.activeItems]) {
      const ageSec = (this.elapsedMs - item.spawnedAt) / 1000;
      if (ageSec >= item.timeWindow) {
        this.expireItem(item);
      }
    }
  }

  private spawnItem(phase: EscalationPhaseConfig): void {
    const type = this.weightedRandom(phase.itemTypeMix);
    const item = this.pool.acquire(type, this.elapsedMs);
    if (!item) return; // pool exhausted

    this.activeItems.push(item);
    EventBus.emit(GameEvent.ITEM_SPAWNED, item);
  }

  private expireItem(item: WorkItemData): void {
    this.removeActive(item.id);
    EventBus.emit(GameEvent.ITEM_EXPIRED, item);

    // Cascade spawn
    if (item.cascadeTrigger) {
      this.spawnCascade(item.cascadeTrigger);
    }
  }

  private spawnCascade(type: WorkItemType): void {
    const phase = this.currentPhase();
    if (this.activeItems.length >= phase.maxActiveItems) return;
    const item = this.pool.acquire(type, this.elapsedMs);
    if (!item) return;
    this.activeItems.push(item);
    EventBus.emit(GameEvent.ITEM_SPAWNED, item);
  }

  private onItemResolved(payload: { item: WorkItemData }): void {
    this.removeActive(payload.item.id);
    this.pool.release(payload.item.id);
  }

  private onItemExpired(item: WorkItemData): void {
    this.pool.release(item.id);
  }

  private removeActive(id: string): void {
    const idx = this.activeItems.findIndex((i) => i.id === id);
    if (idx !== -1) this.activeItems.splice(idx, 1);
  }

  getActiveItems(): WorkItemData[] {
    return this.activeItems;
  }

  getElapsedMs(): number {
    return this.elapsedMs;
  }

  getCurrentPhaseName(): EscalationPhaseName {
    return this.currentPhase().name;
  }

  private currentPhase(): EscalationPhaseConfig {
    return ESCALATION_PHASES[this.currentPhaseIndex];
  }

  private resolvePhaseIndex(elapsedSec: number): number {
    for (let i = ESCALATION_PHASES.length - 1; i >= 0; i--) {
      if (elapsedSec >= ESCALATION_PHASES[i].startTime) {
        return i;
      }
    }
    return 0;
  }

  private weightedRandom(mix: WorkItemTypeWeight[]): WorkItemType {
    const total = mix.reduce((sum, m) => sum + m.weight, 0);
    let rand = Math.random() * total;
    for (const entry of mix) {
      rand -= entry.weight;
      if (rand <= 0) return entry.type;
    }
    return mix[mix.length - 1].type;
  }
}
