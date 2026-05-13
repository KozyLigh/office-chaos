import Phaser from 'phaser';

// Shell — full game loop implemented in NUD-127+
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'GameScene — Coming Soon', {
      fontSize: '24px',
      fontFamily: 'sans-serif',
      color: '#f0f0f0',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.6, '[ tap to return to title ]', {
      fontSize: '16px',
      fontFamily: 'sans-serif',
      color: '#8899aa',
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => this.scene.start('TitleScene'));
  }
}
