import { DestroyRef } from '@angular/core';
import { UI_SEARCH } from '../config/ui-standards';

/**
 * Shared list-query timing: debounce text search, cancel that timer when
 * the user clicks Search/Reset, and ignore stale HTTP responses.
 *
 * Pages still own the actual API call. This only standardizes *when* it runs.
 */
export class ListQuerySession {
  private generation = 0;
  private requestId = 0;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(
    destroyRef?: DestroyRef,
    private readonly debounceMs = UI_SEARCH.debounceMs
  ) {
    destroyRef?.onDestroy(() => this.cancelDebounce());
  }

  /** Text search: run after the user pauses typing. */
  debounce(run: () => void): void {
    this.cancelDebounce();
    const gen = ++this.generation;
    this.debounceHandle = setTimeout(() => {
      this.debounceHandle = null;
      if (gen === this.generation) {
        run();
      }
    }, this.debounceMs);
  }

  /** Search / Reset / Enter: cancel a pending debounce and run now. */
  flush(run: () => void): void {
    this.cancelDebounce();
    this.generation++;
    run();
  }

  cancelDebounce(): void {
    if (this.debounceHandle != null) {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = null;
    }
  }

  beginRequest(): number {
    this.requestId += 1;
    return this.requestId;
  }

  isCurrent(id: number): boolean {
    return id === this.requestId;
  }
}
