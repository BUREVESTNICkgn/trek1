import { Component, Input, NgModule } from '@angular/core';

@Component({
  selector: 'mat-chip-set',
  standalone: true,
  host: { class: 'mat-chip-set' },
  template: `<ng-content></ng-content>`
})
export class MatChipSet {}

@Component({
  selector: 'mat-chip',
  standalone: true,
  host: {
    class: 'mat-chip',
    '[class.mat-chip-primary]': "color === 'primary'"
  },
  template: `<ng-content></ng-content>`
})
export class MatChip {
  @Input() color: 'primary' | 'accent' | 'warn' | undefined;
}

@NgModule({
  imports: [MatChipSet, MatChip],
  exports: [MatChipSet, MatChip]
})
export class MatChipsModule {}
