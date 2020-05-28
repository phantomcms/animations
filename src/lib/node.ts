import { AnimationTransitionStore } from './transition';
import { AnimationTimeline } from './timeline';

export interface AnimationEvent {
  name: string;
  transition: string;
  timeline: AnimationTimeline;
  node: AnimationNode;
}

export class AnimationNode {
  private previousStates: string[] = [];
  private currentState: string;
  private transitions = new AnimationTransitionStore();
  private shouldIgnoreParentAnimation: boolean;

  public targetElement: HTMLElement;
  public parentElement: HTMLElement;

  public name: string;
  public animating: boolean;
  public childAnimations: Map<string, AnimationNode> = new Map();

  public currentTimeline: AnimationTimeline;

  constructor(
    public containerElement: HTMLElement,
    targetElement?: HTMLElement
  ) {
    this.targetElement =
      targetElement || (containerElement.children[0] as HTMLElement);

    this.parentElement = containerElement.parentNode as HTMLElement;
    containerElement.addEventListener('animation', this.handleChild.bind(this));
  }

  addTransition(name: string, timeline: AnimationTimeline) {
    this.transitions.set(name, timeline);
  }

  trigger(state: string) {
    if (this.currentState) {
      this.handleTransition(this.currentState, state);
    } else {
      // we're setting the initial state, noop
    }

    this.previousStates.push(this.currentState);
    this.currentState = state;
  }

  replay(options?: { delay?: number }) {
    const initial = this.previousStates.slice(-1)[0];
    this.handleTransition(initial, this.currentState, {
      replayed: true,
      delay: options ? options.delay || 0 : 0,
    });
  }

  ignoreParentAnimation() {
    this.shouldIgnoreParentAnimation = true;
  }

  private handleTransition(
    initial: string,
    current: string,
    options: {
      replayed?: boolean;
      delay?: number;
    } = {}
  ) {
    const transition = `${initial} => ${current}`;
    // retrieve metadata based on the transition name
    const timeline = this.transitions.find(transition);

    if (timeline) {
      if (!options.replayed) {
        // build and dispatch event to next animation node parent in DOM
        const detail: AnimationEvent = {
          name: this.name,
          timeline,
          transition,
          node: this,
        };

        this.containerElement.dispatchEvent(
          new CustomEvent('animation', { bubbles: true, detail })
        );

        // as this event bubbles, it will be captured by any parent animation-container elements and modified or prevented by
        // adding/removing/changing properties of metadata or reseting the timeline all together
      }

      if (current === 'void') {
        // element is leaving the view, play some DOM trickery to animate them off
        this.handleElementLeave(timeline);
      }

      if (options && options.delay) {
        timeline.addOffset(options.delay);
      }

      this.currentTimeline = timeline;
      this.animating = true;

      this.childAnimations.forEach((node) => {
        if (node && node.currentTimeline && !node.shouldIgnoreParentAnimation) {
          node.currentTimeline.reset();
        }
      });

      // clean up when the animation has finished
      timeline.onFinish(() => {
        this.animating = false;

        if (this.currentState !== 'void') {
          this.currentTimeline.reset();
        }

        this.currentTimeline = undefined;
        this.shouldIgnoreParentAnimation = false;
      });

      timeline.play();
    }
  }

  private handleChild(event: CustomEvent<AnimationEvent>) {
    if (event.detail.name !== this.name) {
      // add to children map
      this.childAnimations.set(event.detail.node.name, event.detail.node);

      // capture and prevent event from bubbling further up DOM tree
      event.stopPropagation();
    }
  }

  private handleElementLeave(timeline: AnimationTimeline) {
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
    }, timeline.computedDuration);
  }
}
