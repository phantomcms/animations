import { AnimationNode } from './node';
import { AnimationMetadata, AnimationState } from './metadata';
import { AnimationGroup } from './group';
import { AnimationTimeline } from './timeline';

// utils
import { parseDuration } from './utils/parseDuration';
import { mapAliasToTransition } from './utils/mapAliasToTransition';
import { parseQuery } from './utils/parseQuery';

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
  data: AnimationCompilationData,
  useElement?: HTMLElement
) => AnimationMetadata | AnimationGroup | AnimationTimeline;

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
      const meta = action(node, data);

      if (meta instanceof AnimationMetadata) {
        // action returned an instance of animation metadata, add it to the timeline
        data.timeline.addMetadata(meta);
      } else if (meta instanceof AnimationGroup) {
        // action returned a group of animation metadata, loop and add eaach to timeline
        meta.flatMetadata.forEach((m) => {
          if (m instanceof AnimationMetadata) {
            data.timeline.addMetadata(m);
          } else if (m instanceof AnimationTimeline) {
            data.timeline.endDelay += m.computedDuration;
          }
        });
      } else if (meta instanceof AnimationTimeline) {
        data.timeline.endDelay += meta.computedDuration;
      }
    });

    node.addTransition(data.transition, data.timeline);

    return void 0;
  };
};

// TODO implement this
const state = (name: string, actions: AnimationStep[]) => {
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
    return void 0;
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
  return function query(
    node: AnimationNode
  ): AnimationMetadata | AnimationGroup | AnimationTimeline {
    // parse query
    const resultQuery = parseQuery(queryString);
    const childData = new AnimationCompilationData();

    let results: HTMLElement[] = Array.from(
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

    let metadata = [];

    for (let element of results) {
      const animationName = element.getAttribute('animation-name');

      if (animationName) {
        // use the animation node instead
        const [action] = actions;

        const childNode = node.childAnimations.get(animationName);

        if (childNode) {
          if (action.name === 'animateChild') {
            metadata.push(action(childNode, undefined));
          } else {
            console.warn(
              `Unsupported animation action: '${action.name}'. Animation elements only support the 'animateChild' action.`
            );
          }
        }
      } else {
        const actionResults = actions.map((action) => {
          const meta = action(node, childData, element);

          if (meta instanceof AnimationMetadata) {
            return meta;
          }
        });

        metadata = metadata.concat(actionResults.filter((x) => !!x));
      }
    }

    if (metadata.length === 1) {
      return metadata[0];
    } else {
      return new AnimationGroup(...metadata);
    }
  };
};

export const sequence = (actions: AnimationStep[]) => {
  return function sequence(
    node: AnimationNode,
    data: AnimationCompilationData
  ) {
    let currentDelay = 0;

    const results = actions.map((action) => {
      const metadata = action(node, data);

      if (metadata.addOffset) {
        const offsetToAdd = currentDelay;
        currentDelay += metadata.computedDuration;
        metadata.addOffset(offsetToAdd);
      }

      return metadata;
    });

    if (results.length === 1) {
      return results[0];
    } else {
      return new AnimationGroup(...results);
    }
  };
};

export const stagger = (
  duration: string | number,
  actions: AnimationStep[]
) => {
  if (typeof duration === 'string') {
    duration = parseDuration(duration);
  }
  return function stagger(
    node: AnimationNode,
    data: AnimationCompilationData,
    useElement?: HTMLElement
  ) {
    const results = actions.map((action) => action(node, data, useElement));

    for (let meta of results) {
      if (
        meta instanceof AnimationMetadata ||
        meta instanceof AnimationTimeline
      ) {
        meta.addOffset(data.currentStaggerOffset);
        // we can safely cast duration to a number here since we've parsed it above
        data.currentStaggerOffset += duration as number;
        return meta;
      }
    }
  };
};

export const animateChild = () => {
  return function animateChild(node: AnimationNode): AnimationTimeline {
    // we can safely cast delay to a number here since we've parsed it above
    node.ignoreParentAnimation();

    // return the node's current timeline so that it can be manipulated as if it were metadata
    return node.currentTimeline;
  };
};
