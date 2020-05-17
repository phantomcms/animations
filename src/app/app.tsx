import { Component, Host, h } from '@stencil/core';
import { trigger, animate, transition, style } from '../lib';

const panel = trigger('something', [
  transition(':enter', [ 
    style({ transform: 'translateX(-400px)', opacity: 0 }),
    animate('300ms ease', style({ transform: 'translateX(0)', opacity: 1 })),
  ])
])

@Component({
  tag: 'app-root',
  styleUrl: 'app.css',
  shadow: true
})
export class AppRoot {

  componentWillLoad() { }

  render() {
    return (
      <Host>
        <animation-container animation={panel}>
          <div class="panel">
            <ul>
              <li>1</li>
              <li>1</li>
              <li>1</li>
              <li>1</li>
              <li>1</li>
            </ul>
          </div>
        </animation-container>
      </Host>
    )
  }
}