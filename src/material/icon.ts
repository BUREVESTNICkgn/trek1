import { Component, Input, NgModule } from '@angular/core';

@Component({
  selector: 'mat-icon',
  standalone: true,
  host: {
    'aria-hidden': 'true',
    class: 'mat-icon'
  },
  template: `<span class="material-icons">{{ fontIcon || svgIcon }}</span>`
})
export class MatIconComponent {
  @Input() fontIcon?: string;
  @Input() svgIcon?: string;
}

@NgModule({
  imports: [MatIconComponent],
  exports: [MatIconComponent]
})
export class MatIconModule {}
