import { AnimationTreeNode } from './tree';
import { AnimationMetadata, AnimationState } from './metadata';

export class AnimationCompilationData {
  styles: AnimationState[] = [];
  states: Map<string, AnimationState> = new Map();
}

export type AnimationStep = ((node: AnimationTreeNode, data: AnimationCompilationData) => any)

// create 
export const trigger = (name: string, actions: AnimationStep[] ) => {
  
  return (node: AnimationTreeNode) => {
    console.time('start trigger');
    const { hostElement } = node;

    // set the name attribute for the container tag
    hostElement.setAttribute('animation-name', name);

    const data = new AnimationCompilationData();

    actions.forEach(action => action(node, data));

    console.timeEnd('start trigger');
  }
}

export const transition = (name: string, actions: AnimationStep[]) => {

  return function transition(node: AnimationTreeNode, data: AnimationCompilationData)   {

    const animations: AnimationMetadata[] = [];
    
    actions.forEach(action => {
      const animation = action(node, data);

      if (animation instanceof AnimationMetadata && data.styles.length) {
        // action was an animation function, generate appropriate states from styles
        // the last element in the styles array is our final state, all previous calls to style should be combined
        const initial = Object.assign({}, ...data.styles.slice(0, -1));
        const final = data.styles.slice(-1)[0];

        Object.keys(initial).forEach((key) => {
          if (key in final === false) {
            delete initial[key];
          }
        })
        
        Object.keys(final).forEach((key) => {
          if (key in initial === false) {
            delete final[key];
          }
        })

        animation.states = [ initial, final ];

        // remove the final style so that we can reuse the intial styles if there are multiple calls to animate
        data.styles.pop();
      }

      animations.push(animation)
    })

    node.addTransition(name.startsWith(':') ? mapAliasToTransition(name) : name, animations)
  }
}

export const state = (name: string, actions: ((node: AnimationTreeNode, data: AnimationCompilationData) => any)[]) => {

  return function state(node: AnimationTreeNode, data: AnimationCompilationData) {
    // check if data.styles is empty
    if (data.styles && data.styles.length) {
      console.error('state() function cannot be invoked if the `styles` array is not empty');
      return;
    }

    // call style/query functions
    actions.forEach(action => action(node, data));
    
    // combine any styles into a single style and store as state
    node.addState(name, Object.assign({}, ...data.styles));

    // empty the data.styles array
    data.styles = [];
  }
}

export const style = (styledata: AnimationState) => {

  return function style(_: AnimationTreeNode, data: AnimationCompilationData) { 
    data.styles.push(styledata);
  }
}

export const animate = (timing: string, style?: (node: AnimationTreeNode, data: AnimationCompilationData) => void) => {

  return function animate(node: AnimationTreeNode, data: AnimationCompilationData): AnimationMetadata {
    if (style) {
      // call the provided style function
      style(node, data);
    }
    
    return new AnimationMetadata(timing);
  }
}

export const query = () => { }

export const sequence = () => { }

export const group = () => { }

export const stagger = () => { }

// TODO animate child should receive a host element, query the tree for the corresponding AnimationTreeNode, and unlock that node
export const animateChild = () => { }

function mapAliasToTransition(alias: string) {
  switch (alias) {
    case ':enter':
      return 'void => *'
    case ':leave':
      return '* => void'
    default:
      throw new Error(`Transition alias '${name}' not recognized`);
  }
}