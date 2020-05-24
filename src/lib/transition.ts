import { AnimationTimeline } from './timeline';

export type AnimationTransitionDictionary = {
  [key: string]: AnimationTimeline | { [key: string]: AnimationTimeline };
};

export class AnimationTransitionStore {
  transitions: AnimationTransitionDictionary = {};

  find(transition: string): AnimationTimeline {
    const parts = transition.split(' ');
    parts.splice(1, 1);

    let result: AnimationTransitionDictionary | AnimationTimeline = this
      .transitions;

    for (let part of parts) {
      if (!result[part] && !result['*']) {
        return;
      }

      result = result[part] || result['*'];
    }

    return result instanceof AnimationTimeline ? result : undefined;
  }

  set(
    transition: string,
    animation: AnimationTimeline,
    options?: { force?: boolean }
  ) {
    const parts = transition.split(' ');
    parts.splice(1, 1);

    let targetLocation: AnimationTransitionDictionary | AnimationTimeline = this
      .transitions;

    for (let part of parts) {
      if (!targetLocation[part]) {
        targetLocation[part] = {};
      }

      targetLocation = targetLocation[part];
    }

    if (
      this.transitions[parts[0]][parts[1]] instanceof AnimationTimeline &&
      (!options || !options.force)
    ) {
      console.warn(
        `A timeline already exists for transtion ${transition}. If you'd like to overwrite it, call this method with the \'force\' option set to true.`
      );
    }

    this.transitions[parts[0]][parts[1]] = animation;
  }
}
