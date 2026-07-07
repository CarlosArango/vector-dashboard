/** Injectable clock so use-cases stay pure and testable. */
export interface Clock {
  now(): Date;
  today(): string; // YYYY-MM-DD
}

export const systemClock: Clock = {
  now: () => new Date(),
  today: () => new Date().toISOString().slice(0, 10),
};
