import { EventBus, GameEvent } from './EventBus';
import { GAME_CONFIG } from '../data/gameConfig';
import type { WorkItemData, WorkItemType } from '../types/WorkItemType';

export class FocusSystem {
  private multiplier: number = GAME_CONFIG.FOCUS_MIN_MULTIPLIER;
  private lastType: WorkItemType | null = null;
  private attentionResidue = false;
  private attentionResidueUntil = 0;
  private elapsedMs = 0;

  init(): void {
    this.multiplier = GAME_CONFIG.FOCUS_MIN_MULTIPLIER;
    this.lastType = null;
    this.attentionResidue = false;
    this.attentionResidueUntil = 0;
    this.elapsedMs = 0;

    EventBus.on(GameEvent.ITEM_RESOLVED, this.onItemResolved, this);
  }

  destroy(): void {
    EventBus.off(GameEvent.ITEM_RESOLVED, this.onItemResolved, this);
  }

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;

    if (this.attentionResidue && this.elapsedMs >= this.attentionResidueUntil) {
      this.attentionResidue = false;
    }
  }

  private onItemResolved(payload: { item: WorkItemData }): void {
    const type = payload.item.type;

    if (this.lastType !== null && this.lastType !== type) {
      // Context switch
      this.multiplier = Math.max(
        GAME_CONFIG.FOCUS_MIN_MULTIPLIER,
        this.multiplier - GAME_CONFIG.CONTEXT_SWITCH_FOCUS_PENALTY
      );
      this.attentionResidue = true;
      this.attentionResidueUntil =
        this.elapsedMs + GAME_CONFIG.ATTENTION_RESIDUE_DURATION_MS;
      EventBus.emit(GameEvent.CONTEXT_SWITCH, { from: this.lastType, to: type });
    } else if (this.lastType === type) {
      // Same type — batching bonus
      this.multiplier = Math.min(
        GAME_CONFIG.FOCUS_MAX_MULTIPLIER,
        this.multiplier + 0.1
      );
    }

    this.lastType = type;
  }

  getMultiplier(): number {
    return this.multiplier;
  }

  isAttentionResidue(): boolean {
    return this.attentionResidue;
  }

  getLastType(): WorkItemType | null {
    return this.lastType;
  }
}
