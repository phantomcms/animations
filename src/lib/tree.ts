import { AnimationMetadata, AnimationState } from './metadata';
import { AnimationTransitionStore } from './transition';

export interface AnimationEvent {
  name: string;
  transition: string;
  metadata: AnimationMetadata[];
  node: AnimationNode;
}

export class AnimationNode {
  private currentState: string;
  private states = new Map<string | number, AnimationState>();
  private transitions = new AnimationTransitionStore();

  public targetElement: HTMLElement;
  public parentElement: HTMLElement;

  public name: string;
  public childAnimations: Map<string, AnimationNode> = new Map();
  public canAnimate = true;

  constructor(public containerElement: HTMLElement) {
    this.targetElement = containerElement.children[0] as HTMLElement;
    this.parentElement = containerElement.parentNode as HTMLElement;
    this.containerElement.addEventListener(
      'animation',
      this.handleChild.bind(this)
    );
  }

  private handleChild(event: CustomEvent<AnimationEvent>) {
    if (event.detail.name !== this.name) {
      // disable child animations by default
      event.detail.node.canAnimate = false;

      // capture and prevent event from bubbling further up DOM tree
      event.stopPropagation();
    }
  }

  private handleElementLeave(metadata: AnimationMetadata[]) {
    const nodes = Array.from(this.containerElement.childNodes);

    // add nodes back to DOM
    nodes.forEach((node) => {
      this.parentElement.appendChild(node);
    });

    // remove nodes from DOM when animations are complete
    setTimeout(() => {
      nodes.forEach((node) => {
        this.parentElement.removeChild(node);
      });
      // TODO use actual animation duration here
    }, 200);
  }

  addState(name: string, state: AnimationState) {
    this.states.set(name, state);
  }

  addTransition(name: string, metadata: AnimationMetadata[]) {
    this.transitions.set(name, metadata);
  }

  trigger(state: string) {
    if (this.currentState) {
      const transition = `${this.currentState} => ${state}`;
      const originalState = this.states.get(this.currentState);
      const nextState = this.states.get(state);

      // retrieve metadata based on the transition name
      const metadata = this.transitions.find(transition);

      // build and emit event to next animation node parent in DOM
      const detail: AnimationEvent = {
        name: this.name,
        metadata,
        transition,
        node: this,
      };
      this.containerElement.dispatchEvent(
        new CustomEvent('animation', { bubbles: true, detail })
      );

      // as this event bubbles, it will be captured by any parent animation-container elements and modified or prevented by
      // adding/removing/changing properties of metadata or flipping the node's canAnimate flag to false

      if (this.canAnimate) {
        if (metadata) {
          if (state === 'void') {
            // element is leaving the view, play some DOM trickery to animate them off
            this.handleElementLeave(metadata);
          }

          metadata.forEach((m) => {
            this.playTransition(m, [originalState, nextState]);
          });
        }
      }
    } else {
      // we're setting the initial state, noop
    }

    this.currentState = state;
  }

  private playTransition(
    metadata: AnimationMetadata,
    providedStates: AnimationState[],
    element = this.targetElement
  ) {
    const states = (
      (metadata && metadata.states ? metadata.states : undefined) ||
      providedStates
    ).filter((x) => !!x);
    const initialState = states[0];

    if (states.length) {
      Object.entries(initialState).forEach(([key, value]) => {
        this.targetElement.style.setProperty(key, `${value}`);
      });

      const animation = element.animate(states, {
        fill: 'forwards',
        ...metadata,
      });
    }
  }
}
