import { Component, Host, h } from '@stencil/core';
import { trigger, animate, transition, style } from '../lib';

const panel = trigger('panel', [
  transition(':enter', [
    style({ transform: 'translateX(-400px)', opacity: 0 }),
    animate('300ms ease', style({ transform: 'translateX(0)' })),
  ]),
]);

const menu = trigger('menu', [
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
  componentWillLoad() {}

  render() {
    return (
      <Host>
        <animation-container animation={panel}>
          <div class="panel">
            <animation-container animation={menu}>
              <ul>
                <li>1</li>
                <li>1</li>
                <li>1</li>
                <li>1</li>
                <li>1</li>
              </ul>
            </animation-container>
          </div>
        </animation-container>
      </Host>
    );
  }
}
