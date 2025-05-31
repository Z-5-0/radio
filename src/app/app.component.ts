import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  // templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  template: `
  <div id="app">
    <router-outlet></router-outlet>
  </div>`
})
export class AppComponent {
  title = 'radio';
}
