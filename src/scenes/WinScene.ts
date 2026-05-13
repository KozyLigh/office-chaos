import Phaser from 'phaser';

// Shell — win screen implemented in NUD-127+
export class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0f3460');
    this.add.text(width / 2, height * 0.4, '🎉 YOU SURVIVED!', {
      fontSize: '36px',
      fontFamily: 'sans-serif',
      color: '#f0f0f0',
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.55, '[ tap to play again ]', {
      fontSize: '18px',
      fontFamily: 'sans-serif',
      color: '#8899aa',
    }).setOrigin(0.5);
    this.input.once('pointerdown', () => this.scene.start('TitleScene'));
  }
}
