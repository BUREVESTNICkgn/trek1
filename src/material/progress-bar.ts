import { Component, Input, NgModule } from '@angular/core';

@Component({
  selector: 'mat-progress-bar',
  standalone: true,
  host: { class: 'mat-progress-bar' },
  template: `
    <div class="mat-progress-bar__track">
      <div class="mat-progress-bar__bar" [style.width.%]="value"></div>
    </div>
  `
})
export class MatProgressBarComponent {
  @Input() value = 0;
}

@NgModule({
  imports: [MatProgressBarComponent],
  exports: [MatProgressBarComponent]
})
export class MatProgressBarModule {}
