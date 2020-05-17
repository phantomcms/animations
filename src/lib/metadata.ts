export interface AnimationTiming {
  duration: number;
  delay: number;
  easing: string;
}

export interface AnimationState {
  [key: string]: string | number;
}

export class AnimationMetadata {
  public duration: number;
  public delay: number;
  public easing: string;

  constructor(
    timing: string | AnimationTiming,
    public states?: AnimationState[]
  ) {
    if (typeof timing === 'string') {
      timing = this.parseTiming(timing);
    }

    this.duration = timing.duration;
    this.delay = timing.delay || 0;
    this.easing = timing.easing || 'ease';
  }

  public offset(duration: number | string) {
    if (typeof duration === 'string') {
      duration = parseDuration(duration);
    }

    this.delay += duration;
  }

  private parseTiming(timing: string): AnimationTiming {
    const timingParts = timing.split(' ');

    let duration: string, delay: string, easing: string;

    if (timingParts.length === 3) {
      [duration, delay, easing] = timingParts;
    } else {
      [duration, easing] = timingParts;
    }

    return {
      duration: parseDuration(duration),
      delay: parseDuration(delay) || 0,
      easing,
    };
  }
}

function parseDuration(duration: string) {
  let value = parseFloat(duration);

  if (!value) {
    return 0;
  }

  if (duration.match(/[0-9]+s$/gi)) {
    value *= 1000;
  }

  return value;
}
