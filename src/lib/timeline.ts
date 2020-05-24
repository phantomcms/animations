import { AnimationMetadata } from './metadata';

export class AnimationTimeline {
  private metadata: AnimationMetadata[] = [];

  public animating: boolean;
  public time = 0;

  constructor() {}

  addMetadata(meta: AnimationMetadata): void {
    this.metadata.push(meta);
  }

  addOffset(offset: number) {
    if (!this.animating && this.canAnimate) {
      this.metadata.forEach((meta) => {
        meta.addOffset(offset);
      });
    }
  }

  play(): void {
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

    requestAnimationFrame(this.tick.bind(this));
  }

  pause(): void {
    if (this.animating) {
      this.metadata.forEach((meta) => {
        meta.play();
      });
    } else {
      console.warn('Cannot pause animation timeline: not playing');
    }

    this.animating = false;
  }

  seek(time: number): void {
    if (!this.animating && this.canAnimate) {
      this.metadata.forEach((meta) => {
        meta.seek(time);
      });
    }

    this.time = time;
  }

  get canAnimate(): boolean {
    return !!(this.metadata && this.metadata.length);
  }

  get computedDuration(): number {
    return Math.max(
      ...(this.metadata && this.metadata.length
        ? this.metadata.map((m) => m.computedDuration)
        : [])
    );
  }

  private tick(): void {
    if (this.animating && this.time <= this.computedDuration) {
      this.time++;

      this.metadata.forEach((meta) => {
        meta.time = this.time;
      });

      requestAnimationFrame(this.tick.bind(this));
    } else if (this.time > this.computedDuration) {
      this.reset();
    }
  }

  private reset() {
    this.pause();
    this.time = 0;

    this.metadata.forEach((meta) => {
      meta.time = 0;
    });
  }
}
