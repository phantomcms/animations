import { Component, Host, Element, Prop, h, Watch, State } from '@stencil/core';
import { AnimationNode } from './tree';

@Component({
  tag: 'animation-container',
  shadow: true,
})
export class AnimationContainer {
  @Element() root: HTMLElement;
  host: HTMLElement;
  parent: HTMLElement;

  @Prop() animation: (node: AnimationNode) => any;

  @Prop() state: string = 'void';

  @State() loaded: boolean;

  node: AnimationNode;

  @Watch('state')
  handleStateChange(state: string) {
    this.node.trigger(state);
  }

  componentWillLoad() {
    this.node = new AnimationNode(this.root);
    this.host = this.root.children[0] as HTMLElement;
    this.parent = this.root.parentNode as HTMLElement;

    // compile animations
    this.animation(this.node);

    // set initial void state
    this.node.trigger('void');
  }

  componentDidLoad() {
    // this component has entered the view, trigger the enter state
    this.node.trigger('next');
  }

  componentWillUnload() {
    console.log('hi');
  }

  componentDidUnload() {
    // trigger void state to animate elements off
    this.node.trigger('void');
  }

  render() {
    console.log('rendering');
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
