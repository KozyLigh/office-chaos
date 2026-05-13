// src/scenes/BootScene.ts — Asset preload with progress bar; transitions to TitleScene
import Phaser from 'phaser';

const BAR_WIDTH = 280;
const BAR_HEIGHT = 18;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // ── Progress bar UI ──────────────────────────────────────────────────────
    // Background track
    const track = this.add.graphics();
    track.fillStyle(0x333355, 1);
    track.fillRoundedRect(cx - BAR_WIDTH / 2, cy - BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, 4);

    // Fill bar (grows left-to-right)
    const fill = this.add.graphics();
    fill.setPosition(cx - BAR_WIDTH / 2, cy - BAR_HEIGHT / 2);

    // Percentage text
    const pct = this.add.text(cx, cy + 24, '0%', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#8899aa',
    }).setOrigin(0.5);

    // "Loading…" label
    this.add.text(cx, cy - 36, 'Loading…', {
      fontSize: '16px',
      fontFamily: 'sans-serif',
      color: '#f0f0f0',
    }).setOrigin(0.5).setAlpha(0.7);

    this.load.on('progress', (value: number) => {
      fill.clear();
      fill.fillStyle(0x5566dd, 1);
      fill.fillRoundedRect(0, 0, BAR_WIDTH * value, BAR_HEIGHT, 4);
      pct.setText(`${Math.round(value * 100)}%`);
    });

    // ── Asset manifest ───────────────────────────────────────────────────────
    // Sprites — load if present, silently skip on 404 (placeholder path is fine for dev)
    const sprites: Array<[string, string]> = [
      ['task-email',    'assets/sprites/task-email.png'],
      ['task-slack',    'assets/sprites/task-slack.png'],
      ['task-meeting',  'assets/sprites/task-meeting.png'],
      ['task-client',   'assets/sprites/task-client.png'],
      ['task-deepwork', 'assets/sprites/task-deepwork.png'],
      ['desk-bg',       'assets/sprites/desk-bg.png'],
      ['logo',          'assets/sprites/logo-office-chaos.png'],
    ];
    sprites.forEach(([key, path]) => this.load.image(key, path));

    // Audio
    const sfx: Array<[string, string]> = [
      ['sfx-handle',  'assets/audio/sfx-handle.wav'],
      ['sfx-defer',   'assets/audio/sfx-defer.wav'],
      ['sfx-ignore',  'assets/audio/sfx-ignore.wav'],
      ['sfx-focus-on','assets/audio/sfx-focus-on.wav'],
      ['sfx-burnout', 'assets/audio/sfx-burnout.wav'],
      ['sfx-win',     'assets/audio/sfx-win.wav'],
    ];
    sfx.forEach(([key, path]) => this.load.audio(key, path));

    // Suppress 404 noise in dev when placeholder assets don't exist yet
    this.load.on('loaderror', () => { /* intentionally silent */ });
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
