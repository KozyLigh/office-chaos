import Phaser from 'phaser';
import type { WorkItemData } from '../types/WorkItemType';
import type { ResolutionAction } from '../types/WorkItemType';
import { tierColor, typeIcon } from './WorkItem';

const CARD = {
  WIDTH: 340,
  HEIGHT: 190,
  PADDING: 16,
  RADIUS: 12,
  BUTTON_W: 72,
  BUTTON_H: 40,
  BUTTON_R: 8,
} as const;

const ACTIONS: { action: ResolutionAction; label: string; color: number; key: string }[] = [
  { action: 'handle', label: 'Handle', color: 0x16a34a, key: 'H' },
  { action: 'delegate', label: 'Delegate', color: 0x2563eb, key: 'D' },
  { action: 'ignore', label: 'Ignore', color: 0x6b7280, key: 'I' },
  { action: 'block-time', label: 'Block Time', color: 0x7c3aed, key: 'B' },
];

type ActionCallback = (action: ResolutionAction, item: WorkItemData) => void;

export class ActionCard extends Phaser.GameObjects.Container {
  private item: WorkItemData | null = null;
  private onAction: ActionCallback;
  private bg!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private subtextText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private buttons: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene, onAction: ActionCallback) {
    super(scene, 0, 0);
    this.onAction = onAction;
    this.setVisible(false);
    this.setDepth(100);

    this._buildCard();
    scene.add.existing(this);
  }

  private _buildCard(): void {
    const { WIDTH, HEIGHT, PADDING, RADIUS } = CARD;

    // Background
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x1e293b, 0.97);
    this.bg.fillRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, RADIUS);
    this.bg.lineStyle(1, 0x334155, 1);
    this.bg.strokeRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, RADIUS);
    this.add(this.bg);

    // Title line
    this.titleText = this.scene.add.text(
      -WIDTH / 2 + PADDING,
      -HEIGHT / 2 + PADDING,
      '',
      {
        fontSize: '15px',
        fontStyle: 'bold',
        fontFamily: 'sans-serif',
        color: '#f1f5f9',
        wordWrap: { width: WIDTH - PADDING * 2 - 28 },
      }
    );
    this.add(this.titleText);

    // Close button
    const closeBtn = this.scene.add
      .text(WIDTH / 2 - PADDING, -HEIGHT / 2 + PADDING, '×', {
        fontSize: '20px',
        fontFamily: 'sans-serif',
        color: '#94a3b8',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.add(closeBtn);

    // Subtext
    this.subtextText = this.scene.add.text(
      -WIDTH / 2 + PADDING,
      -HEIGHT / 2 + PADDING + 28,
      '',
      {
        fontSize: '12px',
        fontFamily: 'sans-serif',
        color: '#94a3b8',
        wordWrap: { width: WIDTH - PADDING * 2 },
      }
    );
    this.add(this.subtextText);

    // Info line (energy cost, context switch warning)
    this.infoText = this.scene.add.text(
      -WIDTH / 2 + PADDING,
      -HEIGHT / 2 + PADDING + 52,
      '',
      {
        fontSize: '12px',
        fontFamily: 'sans-serif',
        color: '#fbbf24',
      }
    );
    this.add(this.infoText);

    // Action buttons
    const btnY = HEIGHT / 2 - CARD.BUTTON_H / 2 - PADDING;
    const totalW = ACTIONS.length * (CARD.BUTTON_W + 8) - 8;
    let bx = -totalW / 2;

    for (const def of ACTIONS) {
      const btn = this._makeButton(bx + CARD.BUTTON_W / 2, btnY, def.label, def.color, () => {
        if (this.item) {
          this.onAction(def.action, this.item);
          this.hide();
        }
      });
      this.buttons.push(btn);
      this.add(btn);
      bx += CARD.BUTTON_W + 8;
    }
  }

  private _makeButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const { BUTTON_W, BUTTON_H, BUTTON_R } = CARD;
    const c = this.scene.add.container(x, y);

    const gfx = this.scene.add.graphics();
    const draw = (col: number) => {
      gfx.clear();
      gfx.fillStyle(col, 1);
      gfx.fillRoundedRect(-BUTTON_W / 2, -BUTTON_H / 2, BUTTON_W, BUTTON_H, BUTTON_R);
    };
    draw(color);

    const txt = this.scene.add.text(0, 0, label, {
      fontSize: '12px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    const hit = this.scene.add
      .rectangle(0, 0, BUTTON_W, BUTTON_H, 0, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => {
      draw(Phaser.Display.Color.IntegerToColor(color).brighten(30).color);
      this.scene.tweens.add({ targets: [gfx, txt], scaleX: 1.06, scaleY: 1.06, duration: 70 });
    });
    hit.on('pointerout', () => {
      draw(color);
      this.scene.tweens.add({ targets: [gfx, txt], scaleX: 1, scaleY: 1, duration: 70 });
    });
    hit.on('pointerdown', onClick);

    c.add([gfx, txt, hit]);
    return c;
  }

  show(item: WorkItemData, screenX: number, screenY: number): void {
    this.item = item;
    const { width, height } = this.scene.scale;
    const { WIDTH, HEIGHT } = CARD;

    // Clamp position so card stays on screen
    const cx = Phaser.Math.Clamp(screenX, WIDTH / 2 + 8, width - WIDTH / 2 - 8);
    const cy = Phaser.Math.Clamp(screenY - HEIGHT / 2 - 12, HEIGHT / 2 + 8, height - HEIGHT / 2 - 8);
    this.setPosition(cx, cy);

    // Populate content
    const icon = typeIcon(item.type);
    this.titleText.setText(`${icon} ${item.label}`);
    this.titleText.setColor(tierColor(item.priorityTier));
    this.subtextText.setText(item.subtext);
    this.infoText.setText(`Energy cost: -${item.energyCost}  ${item.isFalseUrgency ? '⚠ False urgency!' : ''}`);

    this.setVisible(true);
    this.setAlpha(0);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 120, ease: 'Power2' });
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 100,
      onComplete: () => { this.setVisible(false); this.item = null; },
    });
  }

  isVisible(): boolean {
    return this.visible;
  }
}
