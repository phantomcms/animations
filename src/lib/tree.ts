import { AnimationMetadata, AnimationState } from './metadata';
import { AnimationTransitionStore } from './transition';

export class AnimationStore {
  private static instance: AnimationStore;

  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new AnimationStore();
    }

    return this.instance;
  }

  isComplete: boolean;
  private nodes: Map<HTMLElement, AnimationNode> = new Map();
  private currentNode: AnimationNode;

  add(element: HTMLElement) {
    const node = new AnimationNode(element);

    this.nodes.set(element, node);

    if (this.currentNode) {
      // this is an existing tree, define the new node's parent as the current node, and the new node as a child of the current node
      node.parent = this.currentNode;
      this.currentNode.children.push(node);
    }

    this.currentNode = node;

    console.log('down', element);

    return node;
  }

  complete() {
    console.log('up');
    this.currentNode.markAsComplete();

    if (this.currentNode.parent) {
      // attempt to shift currentNode up one if parent exists
      this.currentNode = this.currentNode.parent;
    } else {
      // else mark this tree as complete
      this.isComplete = true;

      console.log('whee complete');
    }
  }

  getNodeForElement(element: HTMLElement): AnimationNode {
    return this.nodes.get(element);
  }

  getParentNodeForElement(element: HTMLElement): AnimationNode {
    return this.nodes.get(element).parent;
  }
}

export class AnimationNode {
  private currentState: string;
  private states = new Map<string | number, AnimationState>();
  private transitions = new AnimationTransitionStore();

  public targetElement: HTMLElement;
  public name: string;
  public complete: boolean;
  public parent?: AnimationNode;
  public children: AnimationNode[] = [];

  constructor(public containerElement: HTMLElement) {
    this.targetElement = containerElement.children[0] as HTMLElement;
  }

  addState(name: string, state: AnimationState) {
    this.states.set(name, state);
  }

  addTransition(name: string, metadata: AnimationMetadata[]) {
    this.transitions.set(name, metadata);
  }

  trigger(state: string) {
    const transitionName = `${this.currentState} => ${state}`;
    const originalState = this.states.get(this.currentState);
    const nextState = this.states.get(state);

    console.log('can animate', this.canAnimate);

    if (this.canAnimate) {
      const metadata = this.transitions.find(transitionName);

      metadata.forEach((m) => {
        this.playTransition(m, [originalState, nextState]);
      });
    }

    this.currentState = state;
  }

  get canAnimate(): boolean {
    return (
      this.complete &&
      (!this.parent || !this.parent.containerElement.getAnimations())
    );
  }

  private playTransition(
    metadata: AnimationMetadata,
    providedStates: AnimationState[]
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

      this.targetElement.animate(states, {
        fill: 'forwards',
        ...metadata,
      });
    }
  }

  markAsComplete() {
    this.complete = true;
  }
}

export const animations = () => {
  return AnimationStore.getInstance();
};
