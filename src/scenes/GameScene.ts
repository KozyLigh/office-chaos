import Phaser from 'phaser';
import { EventBus, GameEvent } from '../systems/EventBus';
import { SpawnSystem } from '../systems/SpawnSystem';
import { EnergySystem } from '../systems/EnergySystem';
import { FocusSystem } from '../systems/FocusSystem';
import { BacklogSystem } from '../systems/BacklogSystem';
import { NudgeSystem } from '../systems/NudgeSystem';
import { TutorialSystem } from '../systems/TutorialSystem';
import { WorkItemPool } from '../objects/WorkItem';
import { WorkItemSprite } from '../objects/WorkItemSprite';
import { ActionCard } from '../objects/ActionCard';
import { HUD } from '../objects/HUD';
import { GAME_CONFIG } from '../data/gameConfig';
import type { WorkItemData, ResolutionAction } from '../types/WorkItemType';

const HUD_H = 72;
const SPAWN_COLS = 2;
const NOTIF_W = 210;
const NOTIF_H = 60;
const NOTIF_GAP = 8;

export interface EndSceneData {
  outcome: 'win' | 'burnout';
  score: number;
  energy: number;
  focusMultiplier: number;
  itemsHandled: number;
  nudgeUseCount: number;
}

export class GameScene extends Phaser.Scene {
  // Systems
  private pool!: WorkItemPool;
  private spawnSystem!: SpawnSystem;
  private energySystem!: EnergySystem;
  private focusSystem!: FocusSystem;
  private backlogSystem!: BacklogSystem;
  private nudgeSystem!: NudgeSystem;
  private tutorialSystem!: TutorialSystem;

  // UI
  private hud!: HUD;
  private actionCard!: ActionCard;
  private spriteMap = new Map<string, WorkItemSprite>();

  // State
  private score = 0;
  private itemsHandled = 0;
  private elapsedMs = 0;
  private gameOver = false;
  private deepWorkActive = false;
  private deepWorkUsesRemaining = GAME_CONFIG.DEEP_WORK_USES;

  // Tutorial overlay text
  private tutorialOverlay!: Phaser.GameObjects.Container;
  private tutorialText!: Phaser.GameObjects.Text;

  // Keyboard keys
  private keyB!: Phaser.Input.Keyboard.Key;
  private keyN!: Phaser.Input.Keyboard.Key;
  private keyP!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameOver = false;
    this.score = 0;
    this.itemsHandled = 0;
    this.elapsedMs = 0;
    this.deepWorkActive = false;
    this.deepWorkUsesRemaining = GAME_CONFIG.DEEP_WORK_USES;
    this.spriteMap.clear();

    // Reset EventBus from any previous session
    EventBus.reset();

    // ── Systems ──────────────────────────────────────────────────────────────
    this.pool = new WorkItemPool();
    this.spawnSystem = new SpawnSystem(this.pool);
    this.energySystem = new EnergySystem();
    this.focusSystem = new FocusSystem();
    this.backlogSystem = new BacklogSystem();
    this.nudgeSystem = new NudgeSystem(this.spawnSystem, this.backlogSystem);
    this.tutorialSystem = new TutorialSystem();

    this.spawnSystem.init();
    this.energySystem.init();
    this.focusSystem.init();
    this.backlogSystem.init();
    this.nudgeSystem.init();
    this.tutorialSystem.init();

    // ── Background ───────────────────────────────────────────────────────────
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e1b4b, 0x1e1b4b, 1);
    bg.fillRect(0, 0, width, height);

    // Desk silhouette (placeholder rectangle, replaced by art asset when available)
    const desk = this.add.graphics();
    desk.fillStyle(0x1e293b, 0.6);
    desk.fillRect(20, height * 0.45, width - 40, height * 0.5);

    // ── HUD ──────────────────────────────────────────────────────────────────
    this.hud = new HUD(this);

    // ── Action card ──────────────────────────────────────────────────────────
    this.actionCard = new ActionCard(this, this._onAction.bind(this));

    // ── Tutorial overlay ──────────────────────────────────────────────────────
    this._buildTutorialOverlay();

    // ── Event bus subscriptions ──────────────────────────────────────────────
    EventBus.on(GameEvent.ITEM_SPAWNED, this._onItemSpawned, this);
    EventBus.on(GameEvent.ITEM_RESOLVED, this._onItemResolved, this);
    EventBus.on(GameEvent.ITEM_EXPIRED, this._onItemExpired, this);
    EventBus.on(GameEvent.CONTEXT_SWITCH, this._onContextSwitch, this);
    EventBus.on(GameEvent.FATIGUE_PENALTY, this._onFatiguePenalty, this);
    EventBus.on(GameEvent.BURNOUT, this._onBurnout, this);
    EventBus.on(GameEvent.BACKLOG_OVERFLOW, this._onBacklogOverflow, this);
    EventBus.on(GameEvent.NUDGE_ACTIVATED, this._onNudgeActivated, this);
    EventBus.on(GameEvent.TUTORIAL_STEP, this._onTutorialStep, this);
    EventBus.on(GameEvent.TUTORIAL_COMPLETE, this._onTutorialComplete, this);

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    if (this.input.keyboard) {
      this.keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    this.elapsedMs += delta;

    // ── System updates ───────────────────────────────────────────────────────
    this.spawnSystem.update(delta);
    this.energySystem.update(delta);
    this.focusSystem.update(delta);
    this.nudgeSystem.update(delta);
    this.backlogSystem.check();
    this.tutorialSystem.update(delta);

    // ── Update sprite timers ─────────────────────────────────────────────────
    for (const sprite of this.spriteMap.values()) {
      sprite.update(delta);
    }

    // ── HUD ─────────────────────────────────────────────────────────────────
    this.hud.update({
      energy: this.energySystem.getEnergy(),
      focusMultiplier: this.focusSystem.getMultiplier(),
      score: this.score,
      backlogCount: this.backlogSystem.getCount(),
      nudgeCooldownMs: this.nudgeSystem.getCooldownRemaining(),
      timeRemainingMs: Math.max(0, GAME_CONFIG.WORKDAY_DURATION_MS - this.elapsedMs),
      deepWorkActive: this.deepWorkActive,
      fatigueActive: this.energySystem.isFatigueActive(),
    });

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    this._handleKeyboard();

    // ── Win check ────────────────────────────────────────────────────────────
    if (this.elapsedMs >= GAME_CONFIG.WORKDAY_DURATION_MS) {
      this._checkWin();
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  private _onItemSpawned(item: WorkItemData): void {
    const pos = this._nextSpritePosition();
    const sprite = new WorkItemSprite(
      this,
      item,
      pos.x,
      pos.y,
      (it, x, y) => {
        this.actionCard.show(it, x, y);
        this.tutorialSystem.onPlayerAction();
      }
    );
    this.spriteMap.set(item.id, sprite);
  }

  private _onItemResolved(payload: { item: WorkItemData; action: ResolutionAction; score: number }): void {
    const sprite = this.spriteMap.get(payload.item.id);
    if (sprite) {
      sprite.dismiss();
      this.spriteMap.delete(payload.item.id);
    }
    this.score += payload.score * this.focusSystem.getMultiplier();
    if (payload.action !== 'ignore') this.itemsHandled++;

    // Float score text
    this._floatScore(payload.score, payload.action);
  }

  private _onItemExpired(item: WorkItemData): void {
    const sprite = this.spriteMap.get(item.id);
    if (sprite) {
      sprite.dismiss();
      this.spriteMap.delete(item.id);
    }
  }

  private _onContextSwitch(): void {
    this.hud.flashContextSwitch();
    this._showAttentionResidue();
  }

  private _onFatiguePenalty(): void {
    this.hud.flashFatigue();
    this._showToast('⚠ Decision fatigue! Energy drain ×2', '#ef4444');
  }

  private _onBurnout(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.cameras.main.fadeOut(600, 30, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('BurnoutScene', this._buildEndData('burnout'));
    });
  }

  private _onBacklogOverflow(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this._showToast('BACKLOG OVERFLOW — BURNED OUT', '#ef4444');
    this.time.delayedCall(800, () => {
      EventBus.emit(GameEvent.BURNOUT);
    });
  }

  private _onNudgeActivated(payload: { resolvedCount: number }): void {
    this._showToast(`⚡ Nudge resolved ${payload.resolvedCount} items!`, '#fbbf24');
  }

  private _onTutorialStep(config: { message: string }): void {
    if (this.tutorialText) {
      this.tutorialText.setText(config.message);
      this.tutorialOverlay.setVisible(true);
    }
  }

  private _onTutorialComplete(): void {
    this.tutorialOverlay.setVisible(false);
  }

  // ── Action resolution ──────────────────────────────────────────────────────

  private _onAction(action: ResolutionAction, item: WorkItemData): void {
    let scoreGain = 0;

    switch (action) {
      case 'handle':
        scoreGain = 100 + (item.isFalseUrgency ? 0 : 20);
        break;
      case 'delegate':
        scoreGain = 60;
        break;
      case 'ignore':
        // Ignore moves item to backlog
        this.backlogSystem.addIgnored(item);
        scoreGain = item.isFalseUrgency ? 40 : 0; // reward correct ignoring of false urgency
        break;
      case 'block-time':
        this._activateBlockTime();
        scoreGain = 0;
        break;
    }

    if (action !== 'block-time') {
      EventBus.emit(GameEvent.ITEM_RESOLVED, { item, action, score: scoreGain });
    }
  }

  private _activateBlockTime(): void {
    if (this.deepWorkActive || this.deepWorkUsesRemaining <= 0) return;

    this.deepWorkActive = true;
    this.deepWorkUsesRemaining--;
    EventBus.emit(GameEvent.DEEP_WORK_ACTIVATED);

    // Visual: purple border overlay
    const { width, height } = this.scale;
    const overlay = this.add.graphics().setDepth(90);
    overlay.lineStyle(6, 0x7c3aed, 0.8);
    overlay.strokeRect(3, 3, width - 6, height - 6);

    this._showToast(`🔮 Deep Work active (${this.deepWorkUsesRemaining} remaining)`, '#a78bfa');

    this.time.delayedCall(GAME_CONFIG.DEEP_WORK_DURATION_MS, () => {
      this.deepWorkActive = false;
      EventBus.emit(GameEvent.DEEP_WORK_DEACTIVATED);
      overlay.destroy();
      this._showToast('Deep Work ended', '#94a3b8');
    });
  }

  // ── Keyboard ───────────────────────────────────────────────────────────────

  private _handleKeyboard(): void {
    if (!this.input.keyboard) return;

    // Close action card
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.actionCard.hide();
    }

    // Nudge
    if (Phaser.Input.Keyboard.JustDown(this.keyN)) {
      this.nudgeSystem.activate();
    }

    // Pause
    if (Phaser.Input.Keyboard.JustDown(this.keyP)) {
      this.scene.launch('PauseScene');
      this.scene.pause();
    }

    // If action card visible, H/D/I/B act on it
    if (this.actionCard.isVisible()) return;

    if (Phaser.Input.Keyboard.JustDown(this.keyB)) {
      this._activateBlockTime();
    }
  }

  // ── Win check ──────────────────────────────────────────────────────────────

  private _checkWin(): void {
    if (this.gameOver) return;
    this.gameOver = true;

    const energy = this.energySystem.getEnergy();
    const backlog = this.backlogSystem.getCount();

    if (energy > GAME_CONFIG.WIN_ENERGY_THRESHOLD && backlog < GAME_CONFIG.WIN_BACKLOG_THRESHOLD) {
      this.cameras.main.fadeOut(500, 0, 30, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('WinScene', this._buildEndData('win'));
      });
    } else {
      EventBus.emit(GameEvent.BURNOUT);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private _buildEndData(outcome: 'win' | 'burnout'): EndSceneData {
    return {
      outcome,
      score: Math.round(this.score),
      energy: Math.round(this.energySystem.getEnergy()),
      focusMultiplier: this.focusSystem.getMultiplier(),
      itemsHandled: this.itemsHandled,
      nudgeUseCount: this.nudgeSystem.getUseCount(),
    };
  }

  private _nextSpritePosition(): { x: number; y: number } {
    const { width } = this.scale;
    const idx = this.spriteMap.size;
    const col = idx % SPAWN_COLS;
    const row = Math.floor(idx / SPAWN_COLS);
    const x = width - NOTIF_W * (SPAWN_COLS - col) - 16 - NOTIF_GAP * col;
    const y = HUD_H + 16 + row * (NOTIF_H + NOTIF_GAP);
    return { x, y };
  }

  private _floatScore(score: number, action: ResolutionAction): void {
    if (score === 0) return;
    const { width } = this.scale;
    const label = action === 'handle' ? `+${score}` : action === 'delegate' ? `↗ +${score}` : `✓ +${score}`;
    const txt = this.add.text(width - 80, HUD_H + 20, label, {
      fontSize: '18px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#4ade80',
    }).setDepth(80).setAlpha(0);

    this.tweens.add({
      targets: txt,
      alpha: 1,
      y: HUD_H,
      duration: 200,
      onComplete: () => {
        this.tweens.add({ targets: txt, alpha: 0, y: HUD_H - 20, duration: 400, onComplete: () => txt.destroy() });
      },
    });
  }

  private _showToast(message: string, color: string): void {
    const { width, height } = this.scale;
    const toast = this.add.text(width / 2, height * 0.82, message, {
      fontSize: '14px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color,
      backgroundColor: '#0f172a',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(95).setAlpha(0);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 200,
      hold: 1600,
      yoyo: true,
      onComplete: () => toast.destroy(),
    });
  }

  private _showAttentionResidue(): void {
    const { width, height } = this.scale;
    const overlay = this.add.graphics().setDepth(88).setAlpha(0);
    overlay.fillStyle(0xfbbf24, 0.08);
    overlay.fillRect(0, HUD_H, width, height - HUD_H);

    const txt = this.add.text(width / 2, height / 2, 'Attention Residue', {
      fontSize: '16px',
      fontFamily: 'sans-serif',
      color: '#fbbf24',
    }).setOrigin(0.5).setDepth(89).setAlpha(0);

    this.tweens.add({
      targets: [overlay, txt],
      alpha: 1,
      duration: 150,
      yoyo: true,
      hold: 400,
      onComplete: () => { overlay.destroy(); txt.destroy(); },
    });
  }

  private _buildTutorialOverlay(): void {
    const { width, height } = this.scale;
    this.tutorialOverlay = this.add.container(width / 2, height * 0.88).setDepth(95).setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x1e293b, 0.92);
    bg.fillRoundedRect(-160, -24, 320, 48, 10);
    this.tutorialOverlay.add(bg);

    this.tutorialText = this.add.text(0, 0, '', {
      fontSize: '13px',
      fontFamily: 'sans-serif',
      color: '#f1f5f9',
      wordWrap: { width: 290 },
    }).setOrigin(0.5);
    this.tutorialOverlay.add(this.tutorialText);
  }

  // Cleanup on scene shutdown
  shutdown(): void {
    EventBus.reset();
    this.spriteMap.clear();
  }
}
