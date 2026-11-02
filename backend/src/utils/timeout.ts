import { TimeoutError } from '../errors/app-error';

/**
 * Runs `task` with an AbortSignal that fires after `ms`. Rejects with a TimeoutError
 * even when the task ignores the signal.
 */
export async function withTimeout<T>(
  step: string,
  ms: number,
  task: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(step, ms));
    }, ms);
  });
  try {
    return await Promise.race([task(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Measures a step and returns its result with the elapsed milliseconds. */
export async function timed<T>(task: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = Date.now();
  const result = await task();
  return { result, ms: Date.now() - start };
}
