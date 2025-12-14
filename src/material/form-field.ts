import { Component, NgModule } from '@angular/core';

@Component({
  selector: 'mat-label',
  standalone: true,
  host: { class: 'mat-label' },
  template: `<ng-content></ng-content>`
})
export class MatLabel {}

@Component({
  selector: 'mat-hint, mat-error',
  standalone: true,
  host: { class: 'mat-hint' },
  template: `<ng-content></ng-content>`
})
export class MatHint {}

@Component({
  selector: 'mat-form-field',
  standalone: true,
  host: { class: 'mat-form-field' },
  template: `
    <div class="mat-form-field__label"><ng-content select="mat-label"></ng-content></div>
    <div class="mat-form-field__control">
      <ng-content select="input, textarea"></ng-content>
      <div class="mat-form-field__hint"><ng-content select="mat-hint, mat-error"></ng-content></div>
    </div>
  `
})
export class MatFormField {}

@NgModule({
  imports: [MatFormField, MatLabel, MatHint],
  exports: [MatFormField, MatLabel, MatHint]
})
export class MatFormFieldModule {}
