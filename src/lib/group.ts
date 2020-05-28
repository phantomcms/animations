import { AnimationMetadata } from './metadata';
import { AnimationTimeline } from './timeline';
import { parseDuration } from './utils/parseDuration';

export class AnimationGroup {
  private _metadata: (
    | AnimationMetadata
    | AnimationGroup
    | AnimationTimeline
  )[] = [];

  constructor(
    ...meta: (AnimationMetadata | AnimationGroup | AnimationTimeline)[]
  ) {
    this._metadata = this._metadata.concat(meta);
  }

  addMetadata(metadata: AnimationMetadata) {
    this._metadata = this.metadata.concat(metadata);
  }

  get metadata() {
    return this._metadata;
  }

  get flatMetadata(): (AnimationMetadata | AnimationTimeline)[] {
    let payload = [];

    this.metadata.forEach((meta) => {
      if (meta instanceof AnimationGroup) {
        payload = payload.concat(meta.flatMetadata);
      }

      payload.push(meta);
    });

    return payload;
  }

  public get computedDuration() {
    return Math.max(...this.flatMetadata.map((meta) => meta.computedDuration));
  }

  public addOffset(duration: number | string) {
    if (typeof duration === 'string') {
      duration = parseDuration(duration);
    }

    this.metadata.forEach((meta) => {
      meta.addOffset(duration as number);
    });
  }
}
