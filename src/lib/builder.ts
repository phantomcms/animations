import { AnimationNode } from './node';
import { AnimationMetadata, AnimationState } from './metadata';
import { AnimationTimeline } from './timeline';
import { parseDuration } from './utils/parseDuration';

export class AnimationCompilationData {
  styles: AnimationState[] = [];
  states: Map<string, AnimationState> = new Map();
  timeline: AnimationTimeline;
  currentStaggerOffset: number = 0;

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

export const query = (
  queryString: string,
  actions: AnimationStep[],
  options: { optional?: boolean; reverse?: boolean } = {}
) => {
  return function query(node: AnimationNode, data: AnimationCompilationData) {
    // parse query
    const resultQuery = parseQuery(queryString);
    const childData = new AnimationCompilationData();

    let results = Array.from(
      node.containerElement.querySelectorAll(resultQuery)
    );

    if (!results.length && !options.optional) {
      console.error(
        `No results found for query '${queryString}'. If this is intentional, you can silence this warning by setting the 'optional' option to true.`
      );
    }

    if (options.reverse) {
      results = results.reverse();
    }

    results.forEach((element: HTMLElement) => {
      const animationName = element.getAttribute('animation-name');

      if (animationName) {
        // use the animation node instead
        const [action] = actions;

        const childNode = node.childAnimations.get(animationName);

        if (action.name === 'animateChild') {
          action(childNode, undefined);
        }
      } else {
        const childNode = new AnimationNode(undefined, element);

        actions
          .map((action) => action(childNode, childData))
          .map((metadata) => {
            if (metadata instanceof AnimationMetadata) {
              data.timeline.addMetadata(metadata);
            }
          });
      }
    });
  };
};

export const sequence = () => {
  throw new Error('Not yet implemented');
};

// TODO what does this do and do we need it?
export const group = () => {
  throw new Error('Not yet implemented');
};

export const stagger = (
  duration: string | number,
  actions: AnimationStep[]
) => {
  if (typeof duration === 'string') {
    duration = parseDuration(duration);
  }
  return function stagger(node: AnimationNode, data: AnimationCompilationData) {
    const results = actions.map((action) => action(node, data));

    for (let meta of results) {
      if (meta instanceof AnimationMetadata) {
        meta.addOffset(data.currentStaggerOffset);
        // we can safely cast duration to a number here since we've parse it above
        data.currentStaggerOffset += duration as number;
        return meta;
      }
    }
  };
};

export const animateChild = (delay?: string | number) => {
  if (typeof delay === 'string') {
    delay = parseDuration(delay);
  }

  return function animateChild(node: AnimationNode) {
    node.canAnimate = true;
    // we can safely cast delay to a number here since we've parsed it above
    node.replay({ delay: delay as number });
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
