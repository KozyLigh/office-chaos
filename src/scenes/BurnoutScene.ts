import Phaser from 'phaser';
import type { EndSceneData } from './GameScene';
import { BURNOUT_LINES, formatLine } from '../data/nudgeLines';

export class BurnoutScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BurnoutScene' });
  }

  create(data: EndSceneData): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Background — desaturated red
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a0a, 0x1a0a0a, 0x2a0f0f, 0x2a0f0f, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    this.add.text(cx, height * 0.16, 'BURNED OUT', {
      fontSize: '48px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#ef4444',
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(cx, height * 0.27, '73% productivity lost.', {
      fontSize: '18px',
      fontFamily: 'sans-serif',
      color: '#94a3b8',
    }).setOrigin(0.5);

    // Stats
    const stats = [
      `Score: ${(data?.score ?? 0).toLocaleString()}`,
      `Energy remaining: ${data?.energy ?? 0}%`,
      `Items handled: ${data?.itemsHandled ?? 0}`,
    ];

    stats.forEach((line, i) => {
      this.add.text(cx, height * 0.38 + i * 28, line, {
        fontSize: '15px',
        fontFamily: 'sans-serif',
        color: '#cbd5e1',
      }).setOrigin(0.5);
    });

    // Rotating burnout line
    const lines = [
      formatLine(BURNOUT_LINES[0], { unread: Math.floor(Math.random() * 200) + 50 }),
      ...BURNOUT_LINES.slice(1),
    ];
    const copyLine = lines[Math.floor(Math.random() * lines.length)];
    this.add.text(cx, height * 0.57, `"${copyLine}"`, {
      fontSize: '14px',
      fontStyle: 'italic',
      fontFamily: 'sans-serif',
      color: '#64748b',
      wordWrap: { width: width * 0.80 },
    }).setOrigin(0.5);

    // Nudge CTA
    this.add.text(cx, height * 0.70, 'Nudge would have routed\nthe noise before this happened.', {
      fontSize: '15px',
      fontFamily: 'sans-serif',
      color: '#fbbf24',
      align: 'center',
    }).setOrigin(0.5);

    // Buttons
    this._makeButton(cx - 90, height * 0.84, 'TRY AGAIN', 0xe94560, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });
    this._makeButton(cx + 90, height * 0.84, 'SEE NUDGE', 0x7c3aed, () => {
      // External link to Nudge — URL from CEO
    });

    this.cameras.main.fadeIn(500, 30, 0, 0);
  }

  private _makeButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
    const W = 160;
    const H = 52;
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(x - W / 2, y - H / 2, W, H, 8);

    this.add.text(x, y, label, {
      fontSize: '16px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.rectangle(x, y, W, H, 0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onClick);
  }
}
