import { AnimationTiming, parseTiming } from './utils/parseTiming';
import { parseDuration } from './utils/parseDuration';

export interface AnimationState {
  [key: string]: string | number;
}

export class AnimationMetadata {
  private duration: number;
  private easing: string;
  private delay: number;
  private additionalDelay: number = 0;

  private animation: Animation;
  private states: AnimationState[] = [];

  private onFinishCallback: () => void;
  private onCancelCallback: () => void;

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

  public useStates(states: AnimationState[]) {
    if (!this.animation) {
      this.states = states;
    }
  }

  public play() {
    if (!this.animating && this.animation) {
      this.animation.play();
    } else if (!this.animation) {
      // set initial state
      Object.entries(this.states[0]).forEach(([key, value]) => {
        this.target.style.setProperty(key, `${value}`);
      });

      this.animation = this.target.animate(this.states, {
        duration: this.duration,
        delay: this.delay + this.additionalDelay,
        easing: this.easing,
        fill: 'forwards',
      });

      this.animation.onfinish = () => {
        this.onFinishCallback?.call(this);
      };

      this.animation.oncancel = () => {
        this.onCancelCallback?.call(this);

        if (!this.onCancelCallback) {
          this.onFinishCallback?.call(this);
        }
      };
    }

    this.animating = true;
  }

  public pause() {
    if (this.animating) {
      this.animation.pause();
    } else {
      console.warn('Cannot pause animation: not playing');
    }

    this.animating = false;
  }

  // TODO implement this
  // @ts-ignore
  public seek(time: number) {
    if (!this.animation) {
      this.play();
      this.pause();
    }

    this.animation.currentTime = time;
  }

  public get timing() {
    return {
      duration: this.duration,
      delay: this.delay + this.additionalDelay,
      easing: this.easing,
      computedDuration: this.computedDuration,
    };
  }

  public get computedDuration() {
    return this.delay + this.additionalDelay + this.duration;
  }

  public addOffset(duration: number | string) {
    if (typeof duration === 'string') {
      duration = parseDuration(duration);
    }

    this.additionalDelay += duration;

    if (this.animation) {
      this.animation.effect.updateTiming({
        delay: this.delay + this.additionalDelay,
      });
    }
  }

  public reset() {
    if (this.animating) {
      this.pause();
    }

    this.additionalDelay = 0;
    this.time = 0;

    this.animation.cancel();

    this.target.removeAttribute('style');
  }

  public onFinish(callback: () => void) {
    this.onFinishCallback = callback;
  }

  public onCancel(callback: () => void) {
    this.onCancelCallback = callback;
  }
}
