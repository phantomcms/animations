import { Component, Host, h, State } from '@stencil/core';
import {
  trigger,
  animate,
  transition,
  style,
  query,
  animateChild,
} from '../lib';

const panel = trigger('panel', [
  transition(':enter', [
    style({ transform: 'translateX(-400px)', opacity: 0 }),
    animate('350ms ease', style({ transform: 'translateX(0)' })),
    query('@*', [animateChild()]),
  ]),
]);

const menu = trigger('menu', [
  transition(':enter', [
    style({ transform: 'translateY(200px)', opacity: 0 }),
    animate('200ms ease', style({ transform: 'translateY(0)', opacity: 1 })),
  ]),
]);

const nope = trigger('nope', [
  transition(':enter', [
    style({ transform: 'translateY(200px)', opacity: 0 }),
    animate('200ms ease', style({ transform: 'translateY(0)', opacity: 1 })),
  ]),
]);

@Component({
  tag: 'app-root',
  styleUrl: 'app.css',
  shadow: true,
})
export class AppRoot {
  @State() shouldShow: boolean;

  handleClick = () => {
    this.shouldShow = !this.shouldShow;
  };

  render() {
    return (
      <Host>
        {/* <animation-container animation={nope}>
          <span>hi</span>
        </animation-container> */}

        <animation-container animation={panel}>
          <div class="panel">
            <animation-container animation={menu}>
              <ul>
                <li>some menu item</li>
                <li>some other menu item</li>
                <li>short item</li>
                <li>thing one</li>
                <li>blue fish</li>
              </ul>
            </animation-container>
          </div>
        </animation-container>
      </Host>
    );
  }
}
