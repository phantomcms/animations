import { AnimationNode } from './tree';
import { AnimationMetadata, AnimationState } from './metadata';

export class AnimationCompilationData {
  styles: AnimationState[] = [];
  states: Map<string, AnimationState> = new Map();
}

export type AnimationStep = (
  node: AnimationNode,
  data: AnimationCompilationData
) => any;

// create
export const trigger = (name: string, actions: AnimationStep[]) => {
  return (node: AnimationNode) => {
    console.time(`trigger ${name}`);
    const { containerElement } = node;

    // set the name attribute for the container tag
    containerElement.setAttribute('animation-name', name);

    const data = new AnimationCompilationData();

    actions.forEach((action) => action(node, data));

    console.timeEnd(`trigger ${name}`);
  };
};

export const transition = (name: string, actions: AnimationStep[]) => {
  return function transition(
    node: AnimationNode,
    data: AnimationCompilationData
  ) {
    const animations: AnimationMetadata[] = [];

    actions.forEach((action) => {
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
        });

        Object.keys(final).forEach((key) => {
          if (key in initial === false) {
            delete final[key];
          }
        });

        animation.states = [initial, final];

        // remove the final style so that we can reuse the intial styles if there are multiple calls to animate
        data.styles.pop();
      }

      animations.push(animation);
    });

    node.addTransition(
      name.startsWith(':') ? mapAliasToTransition(name) : name,
      animations
    );
  };
};

export const state = (
  name: string,
  actions: ((node: AnimationNode, data: AnimationCompilationData) => any)[]
) => {
  return function state(node: AnimationNode, data: AnimationCompilationData) {
    // check if data.styles is empty
    if (data.styles && data.styles.length) {
      console.error(
        'state() function cannot be invoked if the `styles` array is not empty'
      );
      return;
    }

    // call style/query functions
    actions.forEach((action) => action(node, data));

    // combine any styles into a single style and store as state
    node.addState(name, Object.assign({}, ...data.styles));

    // empty the data.styles array
    data.styles = [];
  };
};

export const style = (styledata: AnimationState) => {
  return function style(_: AnimationNode, data: AnimationCompilationData) {
    data.styles.push(styledata);
  };
};

export const animate = (
  timing: string,
  style?: (node: AnimationNode, data: AnimationCompilationData) => void
) => {
  return function animate(
    node: AnimationNode,
    data: AnimationCompilationData
  ): AnimationMetadata {
    if (style) {
      // call the provided style function
      style(node, data);
    }

    return new AnimationMetadata(timing);
  };
};

export const query = (queryString: string, actions: AnimationStep[]) => {
  return function query(node: AnimationNode, data: AnimationCompilationData) {
    // parse query
    const resultQuery = parseQuery(queryString);
    const results = Array.from(
      node.containerElement.querySelectorAll(resultQuery)
    );
  };
};

export const sequence = () => {};

// TODO what does this do and do we need it?
export const group = () => {};

export const stagger = () => {};

// TODO animate child should receive a host element, query the tree for the corresponding AnimationTreeNode, and unlock that node
export const animateChild = () => {
  return function animateChild(node: AnimationNode) {};
};

function parseQuery(query: string) {
  // TODO handle querying for :enter and :leave states

  // replace @ references to child animations
  (query.match(/@[0-z_*-]+/gi) || []).map((match) => {
    query = query.replace(match, `[animation-name='${match.substring(1)}']`);
  });

  return query;
}

function mapAliasToTransition(alias: string) {
  switch (alias) {
    case ':enter':
      return 'void => *';
    case ':leave':
      return '* => void';
    default:
      throw new Error(`Transition alias '${name}' not recognized`);
  }
}
