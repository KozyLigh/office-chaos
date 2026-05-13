import { EventBus, GameEvent } from './EventBus';

const FIRST_SESSION_KEY = 'office_chaos_first_session_done';

export type TutorialStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface TutorialStepConfig {
  step: TutorialStep;
  durationMs: number;
  message: string;
  pauseSpawn: boolean;
}

const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    step: 0,
    durationMs: 3_000,
    message: 'An email just arrived. Click it to inspect!',
    pauseSpawn: true,
  },
  {
    step: 1,
    durationMs: 3_000,
    message: 'Nice! Click [Handle] to resolve it.',
    pauseSpawn: true,
  },
  {
    step: 2,
    durationMs: 2_000,
    message: 'Done! +Focus. Watch your Energy bar.',
    pauseSpawn: false,
  },
  {
    step: 3,
    durationMs: 7_000,
    message: 'A Slack ping appeared. Try resolving both at once!',
    pauseSpawn: false,
  },
  {
    step: 4,
    durationMs: 10_000,
    message: 'Block Time protects you for 15s. Give it a try!',
    pauseSpawn: false,
  },
];

export class TutorialSystem {
  private active = false;
  private currentStep: TutorialStep = 0;
  private stepTimer = 0;
  private complete = false;
  private skipTutorial: boolean;

  constructor() {
    this.skipTutorial = this.shouldSkip();
  }

  init(): void {
    if (this.skipTutorial) {
      this.complete = true;
      return;
    }
    this.currentStep = 0;
    this.stepTimer = 0;
    this.complete = false;
    this.active = true;
    EventBus.emit(GameEvent.TUTORIAL_STEP, this.currentStepConfig());
  }

  update(deltaMs: number): void {
    if (!this.active || this.complete) return;

    this.stepTimer += deltaMs;
    const config = this.currentStepConfig();

    if (this.stepTimer >= config.durationMs) {
      this.advanceStep();
    }
  }

  /** Called when the player completes the required action for a step */
  onPlayerAction(): void {
    if (!this.active || this.complete) return;
    // Steps 0 and 1 advance on player action
    if (this.currentStep <= 1) {
      this.advanceStep();
    }
  }

  private advanceStep(): void {
    const next = (this.currentStep + 1) as TutorialStep;
    if (next > 4) {
      this.finishTutorial();
      return;
    }
    this.currentStep = next;
    this.stepTimer = 0;
    EventBus.emit(GameEvent.TUTORIAL_STEP, this.currentStepConfig());
  }

  private finishTutorial(): void {
    this.complete = true;
    this.active = false;
    this.markSessionDone();
    EventBus.emit(GameEvent.TUTORIAL_COMPLETE);
  }

  getCurrentStep(): TutorialStep {
    return this.currentStep;
  }

  isComplete(): boolean {
    return this.complete;
  }

  isActive(): boolean {
    return this.active;
  }

  shouldPauseSpawn(): boolean {
    if (!this.active || this.complete) return false;
    return this.currentStepConfig().pauseSpawn;
  }

  getCurrentMessage(): string {
    return this.currentStepConfig().message;
  }

  private currentStepConfig(): TutorialStepConfig {
    return TUTORIAL_STEPS[this.currentStep] ?? TUTORIAL_STEPS[0];
  }

  private shouldSkip(): boolean {
    if (typeof window === 'undefined') return true; // non-browser (tests)
    const params = new URLSearchParams(window.location.search);
    if (params.get('skipTutorial') === '1') return true;
    return window.localStorage.getItem(FIRST_SESSION_KEY) === 'done';
  }

  private markSessionDone(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FIRST_SESSION_KEY, 'done');
    }
  }

  /** For testing: reset the first-session flag */
  static resetFirstSession(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(FIRST_SESSION_KEY);
    }
  }

  static isFirstSession(): boolean {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(FIRST_SESSION_KEY) !== 'done';
  }
}
