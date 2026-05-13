import { EventBus, GameEvent } from './EventBus';
import { GAME_CONFIG } from '../data/gameConfig';
import type { WorkItemData } from '../types/WorkItemType';

export class EnergySystem {
  private energy: number = GAME_CONFIG.STARTING_ENERGY;
  private fatigueActive = false;
  private decisionCount30s = 0;
  private decisionWindowStart = 0;
  private deepWorkActive = false;
  private elapsedMs = 0;

  init(): void {
    this.energy = GAME_CONFIG.STARTING_ENERGY;
    this.fatigueActive = false;
    this.decisionCount30s = 0;
    this.decisionWindowStart = 0;
    this.deepWorkActive = false;
    this.elapsedMs = 0;

    EventBus.on(GameEvent.ITEM_RESOLVED, this.onItemResolved, this);
    EventBus.on(GameEvent.DEEP_WORK_ACTIVATED, this.onDeepWorkActivated, this);
    EventBus.on(GameEvent.DEEP_WORK_DEACTIVATED, this.onDeepWorkDeactivated, this);
    EventBus.on(GameEvent.FATIGUE_PENALTY, this.onFatiguePenalty, this);
  }

  destroy(): void {
    EventBus.off(GameEvent.ITEM_RESOLVED, this.onItemResolved, this);
    EventBus.off(GameEvent.DEEP_WORK_ACTIVATED, this.onDeepWorkActivated, this);
    EventBus.off(GameEvent.DEEP_WORK_DEACTIVATED, this.onDeepWorkDeactivated, this);
    EventBus.off(GameEvent.FATIGUE_PENALTY, this.onFatiguePenalty, this);
  }

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;

    // Check if decision window has elapsed, reset counter
    if (
      this.elapsedMs - this.decisionWindowStart >=
      GAME_CONFIG.FATIGUE_WINDOW_MS
    ) {
      this.decisionCount30s = 0;
      this.decisionWindowStart = this.elapsedMs;
      this.fatigueActive = false;
    }

    // Emit low energy warning
    if (this.energy <= 20 && this.energy > 0) {
      EventBus.emit(GameEvent.ENERGY_LOW, { energy: this.energy });
    }

    // Emit burnout
    if (this.energy <= 0) {
      this.energy = 0;
      EventBus.emit(GameEvent.BURNOUT);
    }
  }

  private onItemResolved(payload: { item: WorkItemData }): void {
    const drain = this.fatigueActive
      ? payload.item.energyCost * GAME_CONFIG.FATIGUE_DRAIN_MULTIPLIER
      : payload.item.energyCost;

    this.energy = Math.max(0, this.energy - drain);

    // Track decisions for fatigue
    this.decisionCount30s++;
    if (
      this.decisionCount30s >= GAME_CONFIG.FATIGUE_DECISION_COUNT &&
      !this.fatigueActive
    ) {
      this.fatigueActive = true;
      EventBus.emit(GameEvent.FATIGUE_PENALTY);
    }
  }

  isDeepWorkActive(): boolean {
    return this.deepWorkActive;
  }

  private onDeepWorkActivated(): void {
    this.deepWorkActive = true;
    this.energy = Math.min(
      GAME_CONFIG.STARTING_ENERGY,
      this.energy + GAME_CONFIG.DEEP_WORK_RECHARGE_ENERGY
    );
  }

  private onDeepWorkDeactivated(): void {
    this.deepWorkActive = false;
  }

  private onFatiguePenalty(): void {
    // Fatigue is tracked via fatigueActive flag, drain applied in onItemResolved
  }

  getEnergy(): number {
    return this.energy;
  }

  isFatigueActive(): boolean {
    return this.fatigueActive;
  }

  getDecisionCount(): number {
    return this.decisionCount30s;
  }

  /** Used by DeepWork to recharge */
  recharge(amount: number): void {
    this.energy = Math.min(GAME_CONFIG.STARTING_ENERGY, this.energy + amount);
  }

  /** Direct drain (e.g. item handled outside normal resolution flow) */
  drain(amount: number): void {
    this.energy = Math.max(0, this.energy - amount);
  }
}
