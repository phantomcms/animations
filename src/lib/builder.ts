import { AnimationNode } from './node';
import { AnimationMetadata, AnimationState } from './metadata';
import { AnimationTimeline } from './timeline';

export class AnimationCompilationData {
  styles: AnimationState[] = [];
  states: Map<string, AnimationState> = new Map();
  timeline: AnimationTimeline;

  stateNames: [string, string];

  set transition(name: string) {
    const parts = name.split(' ');
    parts.splice(1, 1);

    this.stateNames = [...parts] as [string, string];
  }

  get transition() {
    return this.stateNames.join(' => ');
  }
}

export type AnimationStep = (
  node: AnimationNode,
  data: AnimationCompilationData
) => any;

// create
export const trigger = (name: string, actions: AnimationStep[]) => {
  return (node: AnimationNode) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`trigger ${name}`);
    }

    // set the name attribute for the container tag/node
    node.containerElement.setAttribute('animation-name', name);
    node.name = name;

    // create an object to store temporary data as it's moved around builder functions
    const data = new AnimationCompilationData();

    // call each of the provided actions
    actions.forEach((action) => action(node, data));

    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`trigger ${name}`);
    }
  };
};

export const transition = (name: string, actions: AnimationStep[]) => {
  return function transition(
    node: AnimationNode,
    data: AnimationCompilationData
  ) {
    data.transition = name.startsWith(':') ? mapAliasToTransition(name) : name;
    data.timeline = new AnimationTimeline();

    actions.forEach((action) => {
      const animation = action(node, data);

      if (animation instanceof AnimationMetadata) {
        // action returned a set of animation metadata, add it to the timeline
        data.timeline.addMetadata(animation);
      }
    });

    node.addTransition(data.transition, data.timeline);
  };
};

export const state = (name: string, actions: AnimationStep[]) => {
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

    // any style functions in the actions array will have added AnimationState objects to the data.styles array
    // we can use them to compile states

    // combine any styles into a single style and store as state
    data.states.set(name, Object.assign({}, ...data.styles));

    // empty the data.styles array to use again in future calls to state/stylez
    data.styles = [];
  };
};

export const style = (styleData: AnimationState) => {
  return function style(_: AnimationNode, data: AnimationCompilationData) {
    data.styles.push(styleData);
  };
};

export const animate = (
  timing: string,
  style?: (node: AnimationNode, data: AnimationCompilationData) => void
) => {
  return function animate(
    node: AnimationNode,
    data: AnimationCompilationData,
    useElement?: HTMLElement
  ): AnimationMetadata {
    if (style) {
      const metadata = new AnimationMetadata(
        timing,
        useElement || node.targetElement
      );

      // call the provided style function, then build animation metadata from styles
      style(node, data);

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

      metadata.useStates([initial, final]);

      // remove the final style so that we can reuse the intial styles if there are multiple calls to animate
      data.styles.pop();

      return metadata;
    }
  };
};

export const query = (queryString: string, actions: AnimationStep[]) => {
  return function query(node: AnimationNode, data: AnimationCompilationData) {
    // parse query
    const resultQuery = parseQuery(queryString);
    const results = Array.from(
      node.containerElement.querySelectorAll(resultQuery)
    ).map((element: HTMLElement) => {
      const animationName = element.getAttribute('animation-name');

      if (animationName) {
        // use the animation node instead
        const [action] = actions;

        const childNode = node.childAnimations.get(animationName);

        if (action.name === 'animateChild') {
          action(childNode, undefined);
        }
      }
    });
  };
};

export const sequence = () => {};

// TODO what does this do and do we need it?
export const group = () => {};

export const stagger = () => {};

// TODO allow strings for delay and parse duration
export const animateChild = (delay?: number) => {
  return function animateChild(node: AnimationNode) {
    node.canAnimate = true;
    node.replay({ delay });
  };
};

function parseQuery(query: string) {
  // TODO handle querying for :enter and :leave states

  // replace @ references to child animations
  (query.match(/@[0-z_*-]+/gi) || []).map((match) => {
    query = query.replace(
      match,
      `[animation-name` +
        (match.substring(1) !== '*' ? `='${match.substring(1)}']` : ']')
    );
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
