import { parseDuration } from './parseDuration';

export interface AnimationTiming {
  duration: number;
  delay: number;
  easing: string;
}

export function parseTiming(timing: string): AnimationTiming {
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
