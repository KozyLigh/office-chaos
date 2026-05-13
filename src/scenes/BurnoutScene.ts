import Phaser from 'phaser';

// Shell — loss/burnout screen implemented in NUD-127+
export class BurnoutScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BurnoutScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0d0d0d');
    this.add.text(width / 2, height * 0.4, '😵 BURNED OUT', {
      fontSize: '36px',
      fontFamily: 'sans-serif',
      color: '#e94560',
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.55, '[ tap to try again ]', {
      fontSize: '18px',
      fontFamily: 'sans-serif',
      color: '#8899aa',
    }).setOrigin(0.5);
    this.input.once('pointerdown', () => this.scene.start('TitleScene'));
  }
}
