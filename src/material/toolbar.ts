import { Component, Input, NgModule } from '@angular/core';

@Component({
  selector: 'mat-toolbar',
  standalone: true,
  host: {
    '[class.mat-toolbar]': 'true',
    '[class.mat-toolbar-primary]': "color === 'primary'",
    '[class.mat-toolbar-accent]': "color === 'accent'",
    '[class.mat-toolbar-warn]': "color === 'warn'"
  },
  template: `
    <div class="mat-toolbar-row">
      <ng-content></ng-content>
    </div>
  `
})
export class MatToolbarComponent {
  @Input() color: 'primary' | 'accent' | 'warn' | undefined;
}

@NgModule({
  imports: [MatToolbarComponent],
  exports: [MatToolbarComponent]
})
export class MatToolbarModule {}
