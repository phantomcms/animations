import { AnimationMetadata } from './metadata';

export type AnimationTransitionDictionary = {
  [key: string]: AnimationMetadata | { [key: string]: AnimationMetadata };
};

export class AnimationTransitionStore {
  transitions: AnimationTransitionDictionary = {};

  constructor() {}

  find(transition: string): AnimationMetadata[] {
    const parts = transition.split(' ');
    parts.splice(1, 1);

    let result: AnimationTransitionDictionary | AnimationMetadata = this
      .transitions;

    for (let part of parts) {
      if (Array.isArray(result)) {
        return result as AnimationMetadata[];
      }

      if (!result[part] && !result['*']) {
        return;
      }

      result = result[part] || result['*'];
    }

    return Array.isArray(result) ? (result as AnimationMetadata[]) : undefined;
  }

  set(transition: string, animation: AnimationMetadata[]) {
    const parts = transition.split(' ');
    parts.splice(1, 1);

    let targetLocation: AnimationTransitionDictionary | AnimationMetadata = this
      .transitions;

    for (let part of parts) {
      if (!targetLocation[part]) {
        targetLocation[part] = {};
      }

      targetLocation = targetLocation[part];
    }

    let currentTransitions = this.transitions[parts[0]][parts[1]];

    if (Array.isArray(currentTransitions)) {
      // there's already a transition here, it should now be an array
      this.transitions[parts[0]][parts[1]] = currentTransitions.concat(
        animation
      );
    } else {
      this.transitions[parts[0]][parts[1]] = animation;
    }
  }
}
