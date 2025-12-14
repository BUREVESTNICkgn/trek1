import { Component, NgModule } from '@angular/core';

@Component({
  selector: 'mat-divider',
  standalone: true,
  host: { class: 'mat-divider' },
  template: ''
})
export class MatDivider {}

@NgModule({
  imports: [MatDivider],
  exports: [MatDivider]
})
export class MatDividerModule {}
