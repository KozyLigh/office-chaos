import Phaser from 'phaser';

/**
 * PauseScene — rendered on top of sleeping GameScene.
 * GameScene calls `this.scene.launch('PauseScene'); this.scene.pause()`.
 * Resuming calls `this.scene.resume('GameScene'); this.scene.stop('PauseScene')`.
 */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.97);
    panel.fillRoundedRect(cx - 130, height * 0.34, 260, 200, 12);

    this.add.text(cx, height * 0.40, 'PAUSED', {
      fontSize: '28px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#f1f5f9',
    }).setOrigin(0.5);

    const resumeBtn = this.add
      .text(cx, height * 0.52, '▶  Resume', {
        fontSize: '20px',
        fontFamily: 'sans-serif',
        color: '#4ade80',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerdown', () => this._resume());

    const quitBtn = this.add
      .text(cx, height * 0.60, '✕  Quit to Title', {
        fontSize: '18px',
        fontFamily: 'sans-serif',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    quitBtn.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.start('TitleScene');
      this.scene.stop('PauseScene');
    });

    // P key or ESC to resume
    if (this.input.keyboard) {
      const p = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      const esc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      p.once('down', () => this._resume());
      esc.once('down', () => this._resume());
    }
  }

  private _resume(): void {
    this.scene.resume('GameScene');
    this.scene.stop('PauseScene');
  }
}
