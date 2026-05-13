import Phaser from 'phaser';

const COLORS = {
  BG_DARK: 0x1a1a2e,
  BG_MID: 0x16213e,
  ACCENT: 0xe94560,
  BUTTON: 0x0f3460,
  BUTTON_HOVER: 0x1a4a7a,
  OFF_WHITE: 0xf0f0f0,
  MUTED: 0x8899aa,
} as const;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // ── Background gradient ──
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.BG_DARK, COLORS.BG_DARK, COLORS.BG_MID, COLORS.BG_MID, 1);
    bg.fillRect(0, 0, width, height);

    // ── Game title ──
    this.add.text(cx, height * 0.28, 'OFFICE', {
      fontSize: '64px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#f0f0f0',
      letterSpacing: 8,
    }).setOrigin(0.5);

    this.add.text(cx, height * 0.38, 'CHAOS', {
      fontSize: '64px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#e94560',
      letterSpacing: 8,
    }).setOrigin(0.5);

    // ── Tagline ──
    this.add.text(cx, height * 0.50, 'Can you survive the workday?', {
      fontSize: '20px',
      fontStyle: 'italic',
      fontFamily: 'sans-serif',
      color: '#8899aa',
    }).setOrigin(0.5);

    // ── CLOCK IN button ──
    this._makeButton(cx, height * 0.64, 'CLOCK IN', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });

    // ── Nudge watermark ──
    this.add.text(width - 12, height * 0.97, 'by Nudge', {
      fontSize: '13px',
      fontFamily: 'sans-serif',
      color: '#8899aa',
    }).setOrigin(1, 1).setAlpha(0.4);

    // Fade in on start
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private _makeButton(cx: number, cy: number, label: string, onClick: () => void): void {
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

    const txt = this.add.text(cx, cy, label, {
      fontSize: '22px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#f0f0f0',
    }).setOrigin(0.5);

    const hitZone = this.add
      .rectangle(cx, cy, W, H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

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
      this.tweens.add({
        targets: [gfx, txt],
        scaleX: 1,
        scaleY: 1,
        duration: 60,
        onComplete: onClick,
      });
    });

    // Keyboard shortcut: Enter / Space to start
    if (this.input.keyboard) {
      const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      const space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      enter.on('down', onClick);
      space.on('down', onClick);
    }
  }
}
