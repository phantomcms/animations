import { Component, Host, h, State } from '@stencil/core';
import {
  trigger,
  animate,
  transition,
  style,
  state,
  query,
  animateChild,
} from '../lib';

// const panel = trigger('panel', [
//   state('void', [style({ transform: 'translateX(-400px)' })]),
//   state('medium', [style({ trandform: 'translateX(-200px)' })]),
//   state('next', [
//     style({ transform: 'translateX(0)' }),
//     query('@menu', [animateChild()]),
//   ]),
//   transition(':enter', [animate('350ms ease')]),
//   transition(':leave', [animate('200ms ease')]),
// ]);

const panel = trigger('panel', [
  transition(':enter', [
    style({ transform: 'translateX(-400px)' }),
    animate('350ms ease', style({ transform: 'translateX(0)' })),
    query('@*', [animateChild()]),
  ]),
  transition(':leave', [
    style({ transform: 'translateX(0)' }),
    animate('250ms ease', style({ transform: 'translateX(-400px)' })),
  ]),
]);

const menu = trigger('menu', [
  transition(':enter', [
    style({ transform: 'translateY(100px)', opacity: 0 }),
    animate('200ms ease', style({ transform: 'translateY(0)', opacity: 1 })),
  ]),
]);

@Component({
  tag: 'app-root',
  styleUrl: 'app.css',
  shadow: true,
})
export class AppRoot {
  @State() shouldShow: boolean = true;

  handleClick = () => {
    this.shouldShow = !this.shouldShow;
  };

  render() {
    return (
      <Host>
        <button onClick={this.handleClick}>toggle</button>
        {this.shouldShow && (
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
        )}
      </Host>
    );
  }
}
