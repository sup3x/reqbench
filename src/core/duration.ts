const DURATION_REGEX = /^(\d+(?:\.\d+)?)(ms|s|m)$/;

const MULTIPLIERS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60000,
};

export function parseDuration(input: string): number {
  const match = input.match(DURATION_REGEX);
  if (!match) {
    throw new Error(`Invalid duration "${input}". Use: 10s, 1m, 500ms`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2];
  const ms = value * MULTIPLIERS[unit];

  if (ms <= 0) {
    throw new Error(`Duration must be positive. Got: "${input}"`);
  }

  return ms;
}
