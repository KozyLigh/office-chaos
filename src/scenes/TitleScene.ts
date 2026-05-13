// src/scenes/TitleScene.ts — Title screen with animated desk bg, CLOCK IN button, How to survive modal
import Phaser from 'phaser';

const COLORS = {
  BG_DARK:      0x1a1a2e,
  BG_MID:       0x16213e,
  ACCENT:       0xe94560,
  BUTTON:       0x0f3460,
  BUTTON_HOVER: 0x1a4a7a,
  OFF_WHITE:    0xf0f0f0,
  MUTED:        0x8899aa,
  MODAL_BG:     0x0d1020,
  MODAL_BORDER: 0x2a3a5a,
} as const;

const HOW_TO_SURVIVE = [
  '1. Tasks appear on your desk as the day goes on.',
  '2. Tap a task card to open it and choose an action.',
  '3. Handle it to score Focus Points and keep sanity.',
  '4. Defer it — but costs escalate each time.',
  '5. Ignore it at your own risk. Meetings are mandatory.',
  '6. Use Focus Mode (F key) to block interruptions.',
  '7. Survive until 5 PM without burning out!',
];

export class TitleScene extends Phaser.Scene {
  private modal: Phaser.GameObjects.Container | null = null;
  private escKey: Phaser.Input.Keyboard.Key | null = null;

  // Desk ambient animation objects
  private paperFloats: Array<{ gfx: Phaser.GameObjects.Graphics; vy: number; x: number; y: number }> = [];

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // ── Background ─────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.BG_DARK, COLORS.BG_DARK, COLORS.BG_MID, COLORS.BG_MID, 1);
    bg.fillRect(0, 0, width, height);

    // ── Animated desk background ────────────────────────────────────────────
    this._createDeskBackground(width, height);

    // ── Game title ──────────────────────────────────────────────────────────
    this.add.text(cx, height * 0.25, 'OFFICE', {
      fontSize: '64px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#f0f0f0',
      letterSpacing: 8,
    }).setOrigin(0.5);

    this.add.text(cx, height * 0.34, 'CHAOS', {
      fontSize: '64px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#e94560',
      letterSpacing: 8,
    }).setOrigin(0.5);

    // ── Tagline ─────────────────────────────────────────────────────────────
    this.add.text(cx, height * 0.46, 'Can you survive the workday?', {
      fontSize: '20px',
      fontStyle: 'italic',
      fontFamily: 'sans-serif',
      color: '#8899aa',
    }).setOrigin(0.5);

    // ── CLOCK IN button ─────────────────────────────────────────────────────
    this._makeClockInButton(cx, height * 0.60);

    // ── How to survive link ─────────────────────────────────────────────────
    const howToLink = this.add.text(cx, height * 0.72, 'How to survive →', {
      fontSize: '18px',
      fontFamily: 'sans-serif',
      color: '#5577cc',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    howToLink.on('pointerover', () => howToLink.setAlpha(0.7));
    howToLink.on('pointerout',  () => howToLink.setAlpha(1));
    howToLink.on('pointerdown', () => this._openModal(width, height));

    // ── Nudge watermark ─────────────────────────────────────────────────────
    this.add.text(width - 12, height * 0.97, 'by Nudge', {
      fontSize: '13px',
      fontFamily: 'sans-serif',
      color: '#8899aa',
    }).setOrigin(1, 1).setAlpha(0.4);

    // ── Keyboard ESC closes modal ────────────────────────────────────────────
    if (this.input.keyboard) {
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escKey.on('down', () => { if (this.modal) this._closeModal(); });
    }

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  update(_time: number, delta: number): void {
    // Animate floating papers
    const { height } = this.scale;
    for (const p of this.paperFloats) {
      p.y -= p.vy * (delta / 1000);
      p.gfx.setPosition(p.x, p.y);
      if (p.y < -20) p.y = height + 20;
    }
  }

  shutdown(): void {
    this.escKey?.removeAllListeners();
    this.paperFloats = [];
  }

  // ── Desk background with floating paper animation ───────────────────────

  private _createDeskBackground(width: number, height: number): void {
    // Desk surface at bottom 30%
    const desk = this.add.graphics();
    desk.fillStyle(0x2a1f1a, 1);
    desk.fillRect(0, height * 0.72, width, height * 0.28);

    // Desk edge highlight
    desk.fillStyle(0x3d2c24, 1);
    desk.fillRect(0, height * 0.72, width, 3);

    // Static decorations: monitor outline
    const monitor = this.add.graphics();
    monitor.lineStyle(3, 0x445566, 0.5);
    monitor.strokeRoundedRect(width * 0.05, height * 0.56, width * 0.35, height * 0.18, 4);
    monitor.fillStyle(0x1a2a3a, 0.4);
    monitor.fillRoundedRect(width * 0.05, height * 0.56, width * 0.35, height * 0.18, 4);

    // Coffee cup
    const cup = this.add.graphics();
    cup.fillStyle(0x8b5e3c, 1);
    cup.fillRoundedRect(width * 0.78, height * 0.75, 30, 28, 4);
    cup.fillStyle(0x5c3d28, 1);
    cup.fillEllipse(width * 0.78 + 15, height * 0.75 + 4, 30, 8);

    // Floating paper notes (ambient animation)
    this.paperFloats = [];
    const paperCount = 6;
    for (let i = 0; i < paperCount; i++) {
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(height * 0.50, height * 0.70);
      const gfx = this.add.graphics();
      gfx.fillStyle(0xfff8e7, 0.12);
      gfx.fillRect(-12, -8, 24, 16);
      gfx.setPosition(x, y);
      gfx.setDepth(1);
      this.paperFloats.push({ gfx, vy: Phaser.Math.FloatBetween(6, 14), x, y });
    }
  }

  // ── CLOCK IN button ─────────────────────────────────────────────────────

  private _makeClockInButton(cx: number, cy: number): void {
    const W = 240;
    const H = 64;
    const R = 10;

    const gfx = this.add.graphics();
    const draw = (color: number) => {
      gfx.clear();
      gfx.fillStyle(color, 1);
      gfx.fillRoundedRect(cx - W / 2, cy - H / 2, W, H, R);
    };
    draw(COLORS.BUTTON);

    const txt = this.add.text(cx, cy, 'CLOCK IN', {
      fontSize: '22px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#f0f0f0',
    }).setOrigin(0.5);

    const hitZone = this.add
      .rectangle(cx, cy, W, H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const doStart = () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    };

    hitZone.on('pointerover', () => {
      draw(COLORS.BUTTON_HOVER);
      this.tweens.add({ targets: [gfx, txt], scaleX: 1.04, scaleY: 1.04, duration: 80 });
    });
    hitZone.on('pointerout', () => {
      draw(COLORS.BUTTON);
      this.tweens.add({ targets: [gfx, txt], scaleX: 1, scaleY: 1, duration: 80 });
    });
    hitZone.on('pointerdown', () => {
      draw(0x0a2a50);
      this.tweens.add({ targets: [gfx, txt], scaleX: 0.97, scaleY: 0.97, duration: 60 });
    });
    hitZone.on('pointerup', () => {
      draw(COLORS.BUTTON);
      this.tweens.add({ targets: [gfx, txt], scaleX: 1, scaleY: 1, duration: 60, onComplete: doStart });
    });

    // Keyboard Enter / Space
    if (this.input.keyboard) {
      const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      const space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      enter.on('down', doStart);
      space.on('down', doStart);
    }
  }

  // ── "How to survive" modal ───────────────────────────────────────────────

  private _openModal(width: number, height: number): void {
    if (this.modal) return;

    const MODAL_W = Math.min(360, width - 32);
    const MODAL_H = 420;
    const mx = (width - MODAL_W) / 2;
    const my = (height - MODAL_H) / 2;

    // Dim overlay — blocks pointer through to game scene
    const dimmer = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0, 0)
      .setInteractive()
      .setDepth(200);

    // Card background
    const card = this.add.graphics().setDepth(201);
    card.fillStyle(COLORS.MODAL_BG, 1);
    card.fillRoundedRect(mx, my, MODAL_W, MODAL_H, 12);
    card.lineStyle(1, COLORS.MODAL_BORDER, 1);
    card.strokeRoundedRect(mx, my, MODAL_W, MODAL_H, 12);

    // Title
    const title = this.add.text(mx + MODAL_W / 2, my + 22, 'How to Survive', {
      fontSize: '20px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#e94560',
    }).setOrigin(0.5).setDepth(202);

    // Divider
    const div = this.add.graphics().setDepth(202);
    div.lineStyle(1, COLORS.MODAL_BORDER, 1);
    div.lineBetween(mx + 16, my + 44, mx + MODAL_W - 16, my + 44);

    // Steps
    const stepItems = HOW_TO_SURVIVE.map((s, i) =>
      this.add.text(mx + 16, my + 56 + i * 46, s, {
        fontSize: '13px',
        fontFamily: 'sans-serif',
        color: '#ccd0e0',
        wordWrap: { width: MODAL_W - 32 },
      }).setDepth(202),
    );

    // Close button — ✕
    const closeBtn = this.add.text(mx + MODAL_W - 14, my + 14, '✕', {
      fontSize: '20px',
      fontFamily: 'sans-serif',
      color: '#8899aa',
    }).setOrigin(1, 0).setDepth(202).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#f0f0f0'));
    closeBtn.on('pointerout',  () => closeBtn.setColor('#8899aa'));
    closeBtn.on('pointerdown', () => this._closeModal());

    // ESC hint
    const hint = this.add.text(mx + MODAL_W / 2, my + MODAL_H - 16, 'ESC to close', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#556677',
    }).setOrigin(0.5, 1).setDepth(202);

    this.modal = this.add
      .container(0, 0, [dimmer, card, div, title, ...stepItems, closeBtn, hint])
      .setDepth(200);

    // Slide in animation
    this.modal.setAlpha(0);
    this.tweens.add({ targets: this.modal, alpha: 1, duration: 180 });
  }

  private _closeModal(): void {
    if (!this.modal) return;
    this.tweens.add({
      targets: this.modal,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.modal?.destroy();
        this.modal = null;
      },
    });
  }
}
