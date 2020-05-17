import { AnimationMetadata, AnimationState } from './metadata';
import { AnimationTransitionStore } from './transition';

export class AnimationTree {
  private static instance: AnimationTree;

  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new AnimationTree();
    }

    return this.instance;
  }

  isComplete: boolean;
  private nodes: Map<HTMLElement, AnimationTreeNode> = new Map();
  private currentNode: AnimationTreeNode;

  add(element: HTMLElement) {
    const node = new AnimationTreeNode(element);

    if (this.isComplete) {
      // we're adding to a complete animation tree, reset it first
      this.reset();
    }

    this.nodes.set(element, node);

    // create node relationships
    if (!this.currentNode) {
      // we've just started this tree, set current node to the node we just created
      this.currentNode = node;
    } else {
      // this is an existing tree, define the new node's parent as the current node, and the new node as a child of the current node
      node.parent = this.currentNode;
      this.currentNode.children.push(node);
    }

    return node;
  }

  complete() {
    this.currentNode.markAsComplete();

    if (this.currentNode.parent) {
      // attempt to shift currentNode up one if parent exists
      this.currentNode = this.currentNode.parent;
    } else {
      // else mark this tree as complete
      this.isComplete = true;
    }
  }

  reset() {
    this.currentNode = undefined;
    this.nodes = new Map();
  }

  getNodeForElement(element: HTMLElement): AnimationTreeNode {
    return this.nodes.get(element);
  }

  getParentNodeForElement(element: HTMLElement): AnimationTreeNode {
    return this.nodes.get(element).parent;
  }
}

export class AnimationTreeNode {
  private currentState: string;
  private states = new Map<string | number, AnimationState>();
  private transitions = new AnimationTransitionStore();

  public name: string;
  public complete: boolean;
  public children: AnimationTreeNode[] = [];
  public parent?: AnimationTreeNode;

  constructor(public hostElement: HTMLElement) {}

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

    // TODO check if can play
    if (true) {
      const metadata = this.transitions.find(transitionName);

      if (metadata) {
        metadata.forEach((m) => {
          this.playTransition(m, [originalState, nextState]);
        });
      }
    }

    this.currentState = state;
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
        this.hostElement.style.setProperty(key, `${value}`);
      });

      this.hostElement.animate(states, {
        fill: 'forwards',
        ...metadata,
      });
    }
  }

  markAsComplete() {
    this.complete = true;
  }
}

export const getAnimationTree = () => {
  return AnimationTree.getInstance();
};
