import { setTimeout } from 'node:timers/promises';
import { describe, expect, it } from 'vitest';
import { mapWithConcurrency } from '../../src/lib/map-with-concurrency.js';

describe(mapWithConcurrency, () => {
  it('returns mapped results in input order', async () => {
    const results = await mapWithConcurrency([1, 2, 3], 2, async (value) => {
      await setTimeout(0);
      return value * 2;
    });

    expect(results).toEqual([2, 4, 6]);
  });

  it('limits concurrent in-flight work', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await mapWithConcurrency([0, 1, 2, 3, 4], 2, async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await setTimeout(10);
      inFlight -= 1;
      return null;
    });

    expect(maxInFlight).toBeLessThanOrEqual(2);
  });

  it('returns an empty array for empty input', async () => {
    await expect(
      mapWithConcurrency([], 3, async () => {
        await setTimeout(0);
        return 0;
      }),
    ).resolves.toEqual([]);
  });
});
