import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Habit } from '../../models/habit';
import { HabitStorageService } from '../../services/habit-storage.service';

@Component({
  selector: 'app-habit-tracker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './habit-tracker.component.html',
  styleUrl: './habit-tracker.component.scss'
})
export class HabitTrackerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly storage = inject(HabitStorageService);

  readonly addHabitForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.required, Validators.maxLength(220)]],
    frequency: ['Каждый день', [Validators.required, Validators.maxLength(40)]]
  });

  readonly searchControl = this.fb.nonNullable.control('');
  readonly habits = this.storage.habits;
  readonly completedToday = computed(() => this.habits().filter((habit) => habit.completedToday).length);
  readonly progress = computed(() =>
    this.habits().length ? Math.round((this.completedToday() / this.habits().length) * 100) : 0
  );
  readonly filteredHabits = computed(() => {
    const term = this.searchControl.value.trim().toLowerCase();
    if (!term) return this.habits();
    return this.habits().filter(
      (habit) =>
        habit.title.toLowerCase().includes(term) || habit.description.toLowerCase().includes(term)
    );
  });

  readonly isEditing = signal(false);
  private editingId: number | null = null;

  get formTitle(): string {
    return this.isEditing() ? 'Редактирование привычки' : 'Добавление новой привычки';
  }

  get submitLabel(): string {
    return this.isEditing() ? 'Сохранить изменения' : 'Добавить привычку';
  }

  submit(): void {
    if (this.addHabitForm.invalid) {
      this.addHabitForm.markAllAsTouched();
      return;
    }

    const { title, description, frequency } = this.addHabitForm.getRawValue();

    if (this.isEditing() && this.editingId !== null) {
      this.storage.updateHabit(this.editingId, {
        title,
        description,
        frequency
      });
    } else {
      this.storage.addHabit({
        title,
        description,
        frequency
      });
    }

    this.resetForm();
  }

  startEdit(habit: Habit): void {
    this.addHabitForm.patchValue({
      title: habit.title,
      description: habit.description,
      frequency: habit.frequency
    });
    this.isEditing.set(true);
    this.editingId = habit.id;
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteHabit(habit: Habit): void {
    this.storage.removeHabit(habit.id);
    if (this.editingId === habit.id) {
      this.resetForm();
    }
  }

  toggleHabit(habit: Habit): void {
    this.storage.toggleCompleted(habit.id);
  }

  resetCompletion(): void {
    this.storage.resetCompletion();
  }

  private resetForm(): void {
    this.addHabitForm.reset({
      title: '',
      description: '',
      frequency: 'Каждый день'
    });
    this.isEditing.set(false);
    this.editingId = null;
  }
}
