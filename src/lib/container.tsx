import { Component, Host, Element, Prop, h, Watch } from '@stencil/core';
import { animations, AnimationNode } from './tree';

@Component({
  tag: 'animation-container',
})
export class AnimationContainer {
  @Element() root: HTMLElement;
  host: HTMLElement;

  @Prop() animation: (node: AnimationNode) => any;

  @Prop() state: string = 'void';

  node: AnimationNode;

  @Watch('state')
  handleStateChange(state: string) {
    this.node.trigger(state);
  }

  componentWillLoad() {
    this.node = animations().add(this.root);
    this.host = this.root.children[0] as HTMLElement;

    this.node.trigger('void');
  }

  componentDidLoad() {
    // mark the tree as complete
    animations().complete();

    // the tree below this point is complete, compile animations
    this.animation(this.node);

    // this component has entered the view, trigger the enter state
    this.node.trigger('next');
  }

  componentDidUnload() {
    const nodes = Array.from(this.host.childNodes);

    // add nodes back to DOM
    nodes.forEach((node) => {
      this.host.appendChild(node);
    });

    // play any leave animations
    // TODO play leave animations

    // remove nodes from DOM when animations are complete
    // TODO use action duration here
    setTimeout(() => {
      nodes.forEach((node) => {
        this.host.parentNode.removeChild(node);
      });
    }, 0);

    // TODO animate nodes off
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
