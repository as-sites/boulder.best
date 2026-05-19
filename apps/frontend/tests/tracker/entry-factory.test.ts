import { describe, expect, it } from 'vitest';
import {
  countClimbsInEntries,
  createBreakEntry,
  createClimbEntry,
  defaultClimbName,
  resequenceEntries,
} from '../../src/tracker/entry-factory.js';

describe('entry factory', () => {
  it('names climbs using climb-only ordinals', () => {
    const entries = [
      createClimbEntry(0, 'Climb 1'),
      createBreakEntry(1),
      createClimbEntry(2, 'Climb 2'),
    ];

    expect(countClimbsInEntries(entries)).toBe(2);
    expect(defaultClimbName(1)).toBe('Climb 2');
  });

  it('resequences entries after removal', () => {
    const entries = [
      createClimbEntry(0, 'Climb 1'),
      createClimbEntry(5, 'Climb 2'),
    ];

    expect(
      resequenceEntries(entries).map((entry) => entry.sequenceOrder),
    ).toEqual([0, 1]);
  });
});
