// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function throttle<k extends Function>(func: k, delay: number): k {
  let lastRun = 0;
  return ((...args: unknown[]) => {
    if (Date.now() - lastRun > delay) {
      func(...args);
      lastRun = Date.now();
    }
  }) as unknown as k;
}