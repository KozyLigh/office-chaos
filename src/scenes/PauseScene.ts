import Phaser from 'phaser';

// Shell — pause overlay implemented in NUD-127+
export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    // Overlay pause menu — does NOT destroy GameScene
    // Uses Phaser scene sleep/wake pattern
  }
}
