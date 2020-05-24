import { Component, Host, h, State } from '@stencil/core';
import { trigger, animate, transition, style, query, stagger } from '../lib';

const panel = trigger('panel', [
  transition(':enter', [
    style({ transform: 'translateX(-400px)' }),
    animate('350ms ease', style({ transform: 'translateX(0)' })),
    query(
      'li',
      [
        style({ opacity: 0, transform: 'translateX(-100px)' }),
        stagger('60ms', [
          animate(
            '200ms ease',
            style({ opacity: 1, transform: 'translateX(0)' })
          ),
        ]),
      ],
      { reverse: true }
    ),
  ]),
  transition(':leave', [
    style({ transform: 'translateX(0)' }),
    query('li', [
      style({ opacity: 1, transform: 'translateX(0)' }),
      stagger('45ms', [
        animate(
          '200ms ease',
          style({ opacity: 0, transform: 'translateX(-100px)' })
        ),
      ]),
    ]),
    animate('200ms 100ms ease', style({ transform: 'translateX(-400px)' })),
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
              <ul>
                <li onClick={this.handleClick}>some menu item</li>
                <li onClick={this.handleClick}>some other menu item</li>
                <li onClick={this.handleClick}>short item</li>
                <li onClick={this.handleClick}>thing one</li>
                <li onClick={this.handleClick}>blue fish</li>
              </ul>
            </div>
          </animation-container>
        )}
      </Host>
    );
  }
}
