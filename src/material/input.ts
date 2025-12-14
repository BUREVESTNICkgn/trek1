import { Directive, HostBinding, NgModule } from '@angular/core';

@Directive({
  selector: 'input[matInput], textarea[matInput]',
  standalone: true,
  host: {
    class: 'mat-input-element'
  }
})
export class MatInput {}

@NgModule({
  imports: [MatInput],
  exports: [MatInput]
})
export class MatInputModule {}
