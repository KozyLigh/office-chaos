import { EventBus, GameEvent } from './EventBus';
import { GAME_CONFIG } from '../data/gameConfig';
import type { WorkItemData } from '../types/WorkItemType';

export class BacklogSystem {
  private backlog: WorkItemData[] = [];
  private overflowed = false;

  init(): void {
    this.backlog = [];
    this.overflowed = false;

    EventBus.on(GameEvent.ITEM_EXPIRED, this.onItemExpired, this);
  }

  destroy(): void {
    EventBus.off(GameEvent.ITEM_EXPIRED, this.onItemExpired, this);
  }

  private onItemExpired(item: WorkItemData): void {
    this.backlog.push(item);
    this.check();
  }

  /** Called when player explicitly ignores an item */
  addIgnored(item: WorkItemData): void {
    this.backlog.push(item);
    this.check();
  }

  check(): void {
    if (
      !this.overflowed &&
      this.backlog.length >= GAME_CONFIG.BACKLOG_OVERFLOW_THRESHOLD
    ) {
      this.overflowed = true;
      EventBus.emit(GameEvent.BACKLOG_OVERFLOW, { count: this.backlog.length });
    }
  }

  /** Remove items resolved by Nudge */
  resolveNudgeable(): WorkItemData[] {
    const resolved: WorkItemData[] = [];
    this.backlog = this.backlog.filter((item) => {
      if (item.nudgeResolvable) {
        resolved.push(item);
        return false;
      }
      return true;
    });
    return resolved;
  }

  getCount(): number {
    return this.backlog.length;
  }

  isOverflowed(): boolean {
    return this.overflowed;
  }

  getBacklog(): WorkItemData[] {
    return this.backlog;
  }
}
