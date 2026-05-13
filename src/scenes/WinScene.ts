import Phaser from 'phaser';
import type { EndSceneData } from './GameScene';
import { WIN_LINES, formatLine } from '../data/nudgeLines';

export class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  create(data: EndSceneData): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a2a1a, 0x0a2a1a, 0x0f3460, 0x0f3460, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    this.add.text(cx, height * 0.16, 'SURVIVED.', {
      fontSize: '52px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#4ade80',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Stats
    const grade = data.energy > 70 ? 'A+' : data.energy > 40 ? 'B' : 'C';
    const stats = [
      `Score: ${data.score.toLocaleString()}  [${grade}]`,
      `Energy remaining: ${data.energy}%`,
      `Focus peak: ${data.focusMultiplier.toFixed(1)}×`,
      `Items handled: ${data.itemsHandled}`,
      `Nudge assists: ${data.nudgeUseCount}`,
    ];

    stats.forEach((line, i) => {
      this.add.text(cx, height * 0.34 + i * 32, line, {
        fontSize: '16px',
        fontFamily: 'sans-serif',
        color: '#cbd5e1',
      }).setOrigin(0.5);
    });

    // Rotating copy line
    const copyLine = WIN_LINES[Math.floor(Math.random() * WIN_LINES.length)];
    const formatted = formatLine(copyLine, {
      focus: data.focusMultiplier.toFixed(1),
      energy: data.energy,
      handled: data.itemsHandled,
      nudge: data.nudgeUseCount,
    });
    this.add.text(cx, height * 0.60, `"${formatted}"`, {
      fontSize: '14px',
      fontStyle: 'italic',
      fontFamily: 'sans-serif',
      color: '#64748b',
      wordWrap: { width: width * 0.80 },
    }).setOrigin(0.5);

    // Nudge CTA
    this.add.text(cx, height * 0.73, 'Nudge automates decisions\nthat drained you today.', {
      fontSize: '15px',
      fontFamily: 'sans-serif',
      color: '#fbbf24',
      align: 'center',
    }).setOrigin(0.5);

    // Buttons
    this._makeButton(cx - 90, height * 0.86, 'ANOTHER DAY', 0x16a34a, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
    });
    this._makeButton(cx + 90, height * 0.86, 'SHARE', 0x2563eb, () => {
      // Share functionality (placeholder — URL from CEO)
    });

    this.cameras.main.fadeIn(400, 0, 30, 0);
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
