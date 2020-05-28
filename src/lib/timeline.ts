import { AnimationMetadata } from './metadata';

export class AnimationTimeline {
  private metadata: AnimationMetadata[] = [];
  private completedCount = 0;

  public animating: boolean;
  public time = 0;
  public endDelay = 0;

  constructor() {}

  public addMetadata(meta: AnimationMetadata): void {
    this.metadata.push(meta);
  }

  public addOffset(offset: number) {
    if (this.canAnimate) {
      this.metadata.forEach((meta) => {
        meta.addOffset(offset);
      });
    }
  }

  public play(): void {
    if (!this.animating && this.canAnimate) {
      this.metadata.forEach((meta) => {
        meta.play();
      });
    } else {
      if (this.animating) {
        console.warn('Cannot play animation timeline: already playing');
      } else {
        console.error('Cannot play animation timeline: no metadata to play');
      }
    }

    this.animating = true;
  }

  public pause(): void {
    if (this.animating) {
      this.metadata.forEach((meta) => {
        meta.pause();
      });
    } else {
      console.warn('Cannot pause animation timeline: not playing');
    }

    this.animating = false;
  }

  public seek(time: number): void {
    if (!this.animating && this.canAnimate) {
      this.metadata.forEach((meta) => {
        meta.seek(time);
      });
    }

    this.time = time;
  }

  public get canAnimate(): boolean {
    return !!(this.metadata && this.metadata.length);
  }

  public get computedDuration(): number {
    return (
      Math.max(
        ...(this.metadata && this.metadata.length
          ? this.metadata.map((m) => m.computedDuration)
          : [0])
      ) + this.endDelay
    );
  }

  public onFinish(callback: () => void) {
    this.metadata.forEach((meta) => {
      meta.onFinish(() => {
        this.completedCount++;

        if (this.completedCount === this.metadata.length) {
          callback();
        }
      });
    });
  }

  public reset() {
    if (this.animating) {
      this.pause();
    }

    this.time = 0;
    this.endDelay = 0;

    this.metadata.forEach((meta) => {
      meta.reset();
    });
  }
}
