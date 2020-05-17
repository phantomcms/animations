import { Component, Host, Element, Prop, h, Watch } from '@stencil/core';
import { getAnimationTree, AnimationTreeNode } from './tree';

@Component({
  tag: 'animation-container',
  shadow: true
})
export class AnimationContainer {

  @Element() root: HTMLElement;
  host: HTMLElement;

  @Prop() animation: (node: AnimationTreeNode) => any;

  @Prop() state: string = 'void';

  node: AnimationTreeNode;

  @Watch('state')
  handleStateChange(state: string) {
    this.node.trigger(state);
  }

  componentWillLoad() {
    this.host = this.root.children[0] as HTMLElement;

    this.node = getAnimationTree().add(this.host);
    this.animation(this.node)

    this.node.trigger('void')
  }

  componentDidLoad() {
    getAnimationTree().complete();
    this.node.trigger('next')
  }

  componentDidUnload() {
    const nodes = Array.from(this.host.childNodes);

    // add nodes back to DOM
    nodes.forEach(node => {
      this.host.appendChild(node)
    });

    // play any leave animations
    // TODO play leave animations

    // remove nodes from DOM when animations are complete
    // TODO use action duration here
    setTimeout(() => {
      nodes.forEach(node => {
        this.host.parentNode.removeChild(node);
      });
    }, 0)

    // TODO animate nodes off
    this.state = 'void';

  }

  render() {
    return (<Host><slot></slot></Host>);
  }
}