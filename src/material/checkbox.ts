import { Component, EventEmitter, HostListener, Input, NgModule, Output } from '@angular/core';

export interface MatCheckboxChange {
  checked: boolean;
  source: MatCheckboxComponent;
}

@Component({
  selector: 'mat-checkbox',
  standalone: true,
  host: {
    class: 'mat-checkbox',
    '[class.mat-checkbox--checked]': 'checked',
    '[attr.role]': "'checkbox'",
    '[attr.aria-checked]': 'checked',
    '[attr.tabindex]': '0'
  },
  template: `
    <label>
      <input type="checkbox" [checked]="checked" (change)="onChange($event)" />
      <span class="mat-checkbox__box" aria-hidden="true"></span>
      <span class="mat-checkbox__label"><ng-content></ng-content></span>
    </label>
  `
})
export class MatCheckboxComponent {
  @Input() checked = false;
  @Output() readonly change = new EventEmitter<MatCheckboxChange>();

  @HostListener('keydown.space', ['$event'])
  @HostListener('keydown.enter', ['$event'])
  handleKeydown(event: Event): void {
    event.preventDefault();
    this.toggle();
  }

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.change.emit({ checked: target.checked, source: this });
  }

  private toggle(): void {
    this.checked = !this.checked;
    this.change.emit({ checked: this.checked, source: this });
  }
}

@NgModule({
  imports: [MatCheckboxComponent],
  exports: [MatCheckboxComponent]
})
export class MatCheckboxModule {}
