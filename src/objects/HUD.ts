import Phaser from 'phaser';
import { GAME_CONFIG } from '../data/gameConfig';

const HUD_H = 72;

interface HUDState {
  energy: number;
  focusMultiplier: number;
  score: number;
  backlogCount: number;
  nudgeCooldownMs: number;
  timeRemainingMs: number;
  deepWorkActive: boolean;
  fatigueActive: boolean;
}

export class HUD {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private energyFill!: Phaser.GameObjects.Graphics;
  private energyText!: Phaser.GameObjects.Text;
  private focusText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private backlogText!: Phaser.GameObjects.Text;
  private backlogFill!: Phaser.GameObjects.Graphics;
  private nudgeText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this._build();
  }

  private _build(): void {
    const { width } = this.scene.scale;
    this.container = this.scene.add.container(0, 0).setDepth(50);

    // Background bar
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.92);
    bg.fillRect(0, 0, width, HUD_H);
    this.container.add(bg);

    // ── Energy bar ──
    const ENERGY_X = 12;
    const ENERGY_W = 140;
    const ENERGY_Y = 12;
    const ENERGY_H = 14;

    this.scene.add.text(ENERGY_X, ENERGY_Y, 'ENERGY', {
      fontSize: '10px',
      fontFamily: 'sans-serif',
      color: '#94a3b8',
    }).setOrigin(0, 0);
    this.container.add(this.scene.children.getByName('ENERGY') ?? this.scene.add.text(ENERGY_X, ENERGY_Y, 'ENERGY', { fontSize: '10px', fontFamily: 'sans-serif', color: '#94a3b8' }));

    // Track text separately for clean adds
    const energyLabel = this.scene.add.text(ENERGY_X, ENERGY_Y, 'ENERGY', {
      fontSize: '10px',
      fontFamily: 'sans-serif',
      color: '#94a3b8',
    });
    this.container.add(energyLabel);

    const energyBg = this.scene.add.graphics();
    energyBg.fillStyle(0x1e293b, 1);
    energyBg.fillRoundedRect(ENERGY_X, ENERGY_Y + 12, ENERGY_W, ENERGY_H, 4);
    this.container.add(energyBg);

    this.energyFill = this.scene.add.graphics();
    this.container.add(this.energyFill);

    this.energyText = this.scene.add.text(ENERGY_X + ENERGY_W + 6, ENERGY_Y + 12, '100', {
      fontSize: '11px',
      fontFamily: 'sans-serif',
      color: '#f1f5f9',
    });
    this.container.add(this.energyText);

    // ── Backlog bar ──
    const BL_X = ENERGY_X;
    const BL_Y = ENERGY_Y + 30;
    const BL_W = ENERGY_W;
    const BL_H = 6;

    const blLabel = this.scene.add.text(BL_X, BL_Y, 'BACKLOG', {
      fontSize: '10px',
      fontFamily: 'sans-serif',
      color: '#94a3b8',
    });
    this.container.add(blLabel);

    const blBg = this.scene.add.graphics();
    blBg.fillStyle(0x1e293b, 1);
    blBg.fillRoundedRect(BL_X, BL_Y + 10, BL_W, BL_H, 3);
    this.container.add(blBg);

    this.backlogFill = this.scene.add.graphics();
    this.container.add(this.backlogFill);

    this.backlogText = this.scene.add.text(BL_X + BL_W + 6, BL_Y + 10, '0/20', {
      fontSize: '10px',
      fontFamily: 'sans-serif',
      color: '#94a3b8',
    });
    this.container.add(this.backlogText);

    // ── Focus multiplier ──
    const MID_X = width / 2;
    this.focusText = this.scene.add.text(MID_X, 12, '1.0×', {
      fontSize: '28px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#a78bfa',
    }).setOrigin(0.5, 0);
    this.container.add(this.focusText);

    const focusLabel = this.scene.add.text(MID_X, 44, 'FOCUS', {
      fontSize: '9px',
      fontFamily: 'sans-serif',
      color: '#64748b',
    }).setOrigin(0.5, 0);
    this.container.add(focusLabel);

    // ── Score ──
    const RIGHT_X = width - 12;
    this.scoreText = this.scene.add.text(RIGHT_X, 12, '0', {
      fontSize: '22px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#fbbf24',
    }).setOrigin(1, 0);
    this.container.add(this.scoreText);

    const scoreLabel = this.scene.add.text(RIGHT_X, 36, 'SCORE', {
      fontSize: '9px',
      fontFamily: 'sans-serif',
      color: '#64748b',
    }).setOrigin(1, 0);
    this.container.add(scoreLabel);

    // ── Time remaining ──
    this.timeText = this.scene.add.text(RIGHT_X, 48, '2:30', {
      fontSize: '13px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#94a3b8',
    }).setOrigin(1, 0);
    this.container.add(this.timeText);

    // ── Nudge status (shown in top center-right) ──
    this.nudgeText = this.scene.add.text(MID_X + 80, 8, 'NUDGE ⚡ READY', {
      fontSize: '11px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#fbbf24',
    }).setOrigin(0, 0);
    this.container.add(this.nudgeText);
  }

  update(state: HUDState): void {
    const { width } = this.scene.scale;
    const ENERGY_X = 12;
    const ENERGY_Y = 12;
    const ENERGY_W = 140;
    const ENERGY_H = 14;

    // Energy fill
    const fraction = state.energy / GAME_CONFIG.STARTING_ENERGY;
    const color = fraction > 0.5 ? 0x16a34a : fraction > 0.2 ? 0xf97316 : 0xef4444;
    this.energyFill.clear();
    this.energyFill.fillStyle(color, 1);
    this.energyFill.fillRoundedRect(
      ENERGY_X,
      ENERGY_Y + 12,
      ENERGY_W * fraction,
      ENERGY_H,
      4
    );
    this.energyText.setText(Math.round(state.energy).toString());

    // Backlog fill
    const BL_X = ENERGY_X;
    const BL_Y = ENERGY_Y + 30;
    const BL_W = ENERGY_W;
    const blFraction = Math.min(1, state.backlogCount / GAME_CONFIG.BACKLOG_OVERFLOW_THRESHOLD);
    const blColor = blFraction > 0.8 ? 0xef4444 : blFraction > 0.5 ? 0xf97316 : 0x3b82f6;
    this.backlogFill.clear();
    this.backlogFill.fillStyle(blColor, 1);
    this.backlogFill.fillRoundedRect(BL_X, BL_Y + 10, BL_W * blFraction, 6, 3);
    this.backlogText.setText(`${state.backlogCount}/20`);

    // Focus
    this.focusText.setText(`${state.focusMultiplier.toFixed(1)}×`);
    this.focusText.setColor(state.deepWorkActive ? '#7c3aed' : '#a78bfa');
    if (state.fatigueActive) this.focusText.setColor('#ef4444');

    // Score
    this.scoreText.setText(state.score.toFixed(0));

    // Time
    const sec = Math.max(0, Math.ceil(state.timeRemainingMs / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    this.timeText.setText(`${m}:${s.toString().padStart(2, '0')}`);
    if (sec <= 10) this.timeText.setColor('#ef4444');
    else this.timeText.setColor('#94a3b8');

    // Nudge
    if (state.nudgeCooldownMs <= 0) {
      this.nudgeText.setText('NUDGE ⚡ READY');
      this.nudgeText.setColor('#fbbf24');
      this.nudgeText.setAlpha(1);
    } else {
      const cooldownSec = Math.ceil(state.nudgeCooldownMs / 1000);
      this.nudgeText.setText(`NUDGE ⚡ ${cooldownSec}s`);
      this.nudgeText.setColor('#64748b');
    }
  }

  /** Flashes the energy bar on fatigue penalty */
  flashFatigue(): void {
    this.scene.tweens.add({
      targets: this.energyFill,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.energyFill.setAlpha(1),
    });
  }

  /** Flashes focus text on context switch */
  flashContextSwitch(): void {
    this.scene.tweens.add({
      targets: this.focusText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
    });
  }
}
