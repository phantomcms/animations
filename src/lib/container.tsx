import { Component, Host, Element, Prop, Event, Watch, h } from '@stencil/core';
import { AnimationNode } from './node';

// load polyfill if required
if (!document.body.animate) {
  import('./polyfills/web-animations.min.js');
}

@Component({
  tag: 'animation-container',
  assetsDir: './polyfills',
  shadow: true,
})
export class AnimationContainer {
  @Element() root: HTMLElement;

  @Prop() animation: (node: AnimationNode) => any;
  @Prop() state: string;

  @Prop() onAnimationLoad: (node: AnimationNode) => void;

  node: AnimationNode;

  @Watch('state')
  handleStateChange(state: string) {
    this.node.trigger(state);
  }

  componentWillLoad() {
    this.node = new AnimationNode(this.root);

    // set initial void state
    this.node.trigger('void');
  }

  componentDidLoad() {
    // compile animations
    this.animation(this.node);

    // this component has entered the view, trigger the enter state
    this.node.trigger('next');

    if (this.onAnimationLoad) {
      this.onAnimationLoad(this.node);
    }
  }

  componentDidUnload() {
    // trigger void state to animate elements off
    this.node.trigger('void');
  }

  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
