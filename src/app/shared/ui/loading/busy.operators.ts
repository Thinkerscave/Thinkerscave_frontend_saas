import { MonoTypeOperatorFunction, defer, finalize, Observable } from 'rxjs';

export type BusySetter = (busy: boolean) => void;

/**
 * Ensures a busy flag is set for the lifetime of the subscription and always
 * cleared on complete, error, or unsubscribe (navigation away).
 */
export function withBusy<T>(setBusy: BusySetter): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    defer(() => {
      setBusy(true);
      return source.pipe(finalize(() => setBusy(false)));
    });
}

/**
 * Clears busy in finalize only — use when you set busy=true before subscribe.
 */
export function finalizeBusy<T>(setBusy: BusySetter): MonoTypeOperatorFunction<T> {
  return finalize(() => setBusy(false));
}
