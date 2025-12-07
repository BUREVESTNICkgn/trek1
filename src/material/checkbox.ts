import { Component, EventEmitter, Input, NgModule, Output } from '@angular/core';

export interface MatCheckboxChange {
  checked: boolean;
  source: MatCheckboxComponent;
}

@Component({
  selector: 'mat-checkbox',
  standalone: true,
  host: { class: 'mat-checkbox' },
  template: `
    <label>
      <input type="checkbox" [checked]="checked" (change)="onChange($event)" />
      <span class="mat-checkbox__box"></span>
      <span class="mat-checkbox__label"><ng-content></ng-content></span>
    </label>
  `
})
export class MatCheckboxComponent {
  @Input() checked = false;
  @Output() readonly change = new EventEmitter<MatCheckboxChange>();

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.change.emit({ checked: target.checked, source: this });
  }
}

@NgModule({
  imports: [MatCheckboxComponent],
  exports: [MatCheckboxComponent]
})
export class MatCheckboxModule {}
