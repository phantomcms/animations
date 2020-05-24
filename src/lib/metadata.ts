import { AnimationTiming, parseTiming } from './utils/parseTiming';
import { parseDuration } from './utils/parseDuration';

export interface AnimationState {
  [key: string]: string | number;
}

export class AnimationMetadata {
  private duration: number;
  private delay: number;
  private easing: string;

  private animation: Animation;
  private states: AnimationState[] = [];

  public animating: boolean;
  public time = 0;

  constructor(timing: string | AnimationTiming, private target: HTMLElement) {
    if (typeof timing === 'string') {
      timing = parseTiming(timing);
    }

    this.duration = timing.duration;
    this.delay = timing.delay || 0;
    this.easing = timing.easing || 'ease';
  }

  useStates(states: AnimationState[]) {
    if (!this.animation) {
      this.states = states;
    }
  }

  play() {
    if (!this.animating && this.animation) {
      this.animation.play();
    } else if (!this.animation) {
      // set initial state
      Object.entries(this.states[0]).forEach(([key, value]) => {
        this.target.style.setProperty(key, `${value}`);
      });

      this.animation = this.target.animate(this.states, {
        ...this.timing,
        fill: 'forwards',
      });
    }

    this.animating = true;
  }

  pause() {
    this.animating = false;

    if (this.animating) {
      this.animation.pause();
    } else {
      console.warn('Cannot pause animation: not playing');
    }
  }

  seek(time: number) {
    throw new Error('Not yet implemented');
  }

  get timing() {
    return {
      duration: this.duration,
      delay: this.delay,
      easing: this.easing,
      computedDuration: this.computedDuration,
    };
  }

  get computedDuration() {
    return this.delay + this.duration;
  }

  public addOffset(duration: number | string) {
    if (typeof duration === 'string') {
      duration = parseDuration(duration);
    }

    this.delay += duration;

    if (this.animation) {
      this.animation.effect.updateTiming({ delay: this.delay });
    }
  }
}
