import Phaser from 'phaser';
import type { WorkItemData } from '../types/WorkItemType';
import { tierColor, typeIcon } from './WorkItem';

const NOTIF = {
  WIDTH: 200,
  HEIGHT: 52,
  RADIUS: 8,
} as const;

type ClickCallback = (item: WorkItemData, x: number, y: number) => void;

/**
 * Phaser Container that visually represents a single WorkItemData as a
 * notification badge sliding in from the right edge.
 */
export class WorkItemSprite extends Phaser.GameObjects.Container {
  readonly item: WorkItemData;
  private timerBar!: Phaser.GameObjects.Graphics;
  private bg!: Phaser.GameObjects.Graphics;
  private readonly timeWindow: number;
  private elapsedMs = 0;
  private _onClick: ClickCallback;

  constructor(
    scene: Phaser.Scene,
    item: WorkItemData,
    x: number,
    y: number,
    onClick: ClickCallback
  ) {
    super(scene, x, y);
    this.item = item;
    this.timeWindow = item.timeWindow * 1000;
    this._onClick = onClick;

    this._build();
    scene.add.existing(this);
    this._slideIn();
  }

  private _build(): void {
    const { WIDTH, HEIGHT, RADIUS } = NOTIF;
    const color = Phaser.Display.Color.HexStringToColor(tierColor(this.item.priorityTier)).color;

    // Card background
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x1e293b, 0.93);
    this.bg.fillRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, RADIUS);
    this.bg.lineStyle(2, color, 1);
    this.bg.strokeRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, RADIUS);
    this.add(this.bg);

    // Icon
    this.add(
      this.scene.add.text(-WIDTH / 2 + 10, 0, typeIcon(this.item.type), {
        fontSize: '20px',
        fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5)
    );

    // Label
    this.add(
      this.scene.add.text(-WIDTH / 2 + 40, -8, this.item.label, {
        fontSize: '11px',
        fontStyle: 'bold',
        fontFamily: 'sans-serif',
        color: '#f1f5f9',
        wordWrap: { width: WIDTH - 50 },
      }).setOrigin(0, 0)
    );

    // Subtext
    this.add(
      this.scene.add.text(-WIDTH / 2 + 40, 10, `−${this.item.energyCost} energy`, {
        fontSize: '10px',
        fontFamily: 'sans-serif',
        color: '#94a3b8',
      }).setOrigin(0, 0)
    );

    // Timer bar (fills bottom of card)
    this.timerBar = this.scene.add.graphics();
    this.add(this.timerBar);
    this._drawTimerBar(1);

    // Interactive hit zone — at least 44×44 px touch target
    const hitH = Math.max(HEIGHT, 44);
    const hit = this.scene.add
      .rectangle(0, 0, Math.max(WIDTH, 44), hitH, 0, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerdown', () => {
      this._onClick(this.item, this.x, this.y);
    });
    hit.on('pointerover', () => {
      this.scene.tweens.add({ targets: this, scaleX: 1.04, scaleY: 1.04, duration: 80 });
    });
    hit.on('pointerout', () => {
      this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 80 });
    });
    this.add(hit);
  }

  private _slideIn(): void {
    const startX = this.x + NOTIF.WIDTH;
    this.setX(startX);
    this.scene.tweens.add({
      targets: this,
      x: this.x - NOTIF.WIDTH,
      duration: 220,
      ease: 'Power2.easeOut',
    });
    // Pulse on spawn
    this.setAlpha(0);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 150 });
  }

  private _drawTimerBar(fraction: number): void {
    const { WIDTH, HEIGHT } = NOTIF;
    this.timerBar.clear();
    const color = fraction > 0.4 ? 0x16a34a : fraction > 0.2 ? 0xfbbf24 : 0xef4444;
    this.timerBar.fillStyle(color, 0.7);
    const barW = (WIDTH - 8) * fraction;
    this.timerBar.fillRoundedRect(-WIDTH / 2 + 4, HEIGHT / 2 - 5, barW, 3, 1.5);
  }

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    const fraction = Math.max(0, 1 - this.elapsedMs / this.timeWindow);
    this._drawTimerBar(fraction);
  }

  dismiss(): void {
    this.scene.tweens.add({
      targets: this,
      x: this.x + NOTIF.WIDTH + 20,
      alpha: 0,
      duration: 200,
      ease: 'Power2.easeIn',
      onComplete: () => this.destroy(),
    });
  }
}
