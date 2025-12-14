import { Directive, HostBinding, Input, NgModule } from '@angular/core';

@Directive({
  selector:
    'button[mat-button], button[mat-raised-button], button[mat-stroked-button], button[mat-flat-button], button[mat-icon-button], a[mat-button], a[mat-raised-button], a[mat-stroked-button], a[mat-flat-button]',
  standalone: true,
  host: {
    '[class.mat-button]': "variant === 'basic'",
    '[class.mat-raised-button]': "variant === 'raised'",
    '[class.mat-stroked-button]': "variant === 'stroked'",
    '[class.mat-flat-button]': "variant === 'flat'",
    '[class.mat-icon-button]': "variant === 'icon'",
    '[class.mat-primary]': "color === 'primary'",
    '[class.mat-accent]': "color === 'accent'",
    '[class.mat-warn]': "color === 'warn'"
  }
})
export class MatButton {
  @Input() color: 'primary' | 'accent' | 'warn' | 'default' = 'primary';
  @Input()
  set matRaisedButton(value: boolean) {
    if (value !== false) this.variant = 'raised';
  }
  @Input()
  set matStrokedButton(value: boolean) {
    if (value !== false) this.variant = 'stroked';
  }
  @Input()
  set matFlatButton(value: boolean) {
    if (value !== false) this.variant = 'flat';
  }
  @Input()
  set matButton(value: boolean) {
    if (value !== false) this.variant = 'basic';
  }
  @Input()
  set matIconButton(value: boolean) {
    if (value !== false) this.variant = 'icon';
  }

  @HostBinding('class.mat-button-base') readonly baseClass = true;

  variant: 'basic' | 'raised' | 'stroked' | 'flat' | 'icon' = 'basic';
}

@NgModule({
  imports: [MatButton],
  exports: [MatButton]
})
export class MatButtonModule {}
