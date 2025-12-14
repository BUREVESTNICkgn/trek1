import { Component, NgModule } from '@angular/core';

@Component({
  selector: 'mat-card',
  standalone: true,
  host: { class: 'mat-card' },
  template: `<ng-content></ng-content>`
})
export class MatCardComponent {}

@Component({
  selector: 'mat-card-header',
  standalone: true,
  host: { class: 'mat-card-header' },
  template: `<ng-content></ng-content>`
})
export class MatCardHeader {}

@Component({
  selector: 'mat-card-content',
  standalone: true,
  host: { class: 'mat-card-content' },
  template: `<ng-content></ng-content>`
})
export class MatCardContent {}

@Component({
  selector: 'mat-card-actions',
  standalone: true,
  host: { class: 'mat-card-actions' },
  template: `<ng-content></ng-content>`
})
export class MatCardActions {}

@NgModule({
  imports: [MatCardComponent, MatCardHeader, MatCardContent, MatCardActions],
  exports: [MatCardComponent, MatCardHeader, MatCardContent, MatCardActions]
})
export class MatCardModule {}
