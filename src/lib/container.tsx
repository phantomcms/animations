import { Component, Host, Element, Prop, h, Watch } from '@stencil/core';
import { AnimationNode } from './node';

@Component({
  tag: 'animation-container',
  shadow: true,
})
export class AnimationContainer {
  @Element() root: HTMLElement;

  @Prop() animation: (node: AnimationNode) => any;

  @Prop() state: string;

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
