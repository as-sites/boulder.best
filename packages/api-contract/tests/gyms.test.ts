import { describe, expect, it } from 'vitest';
import {
  CUSTOM_V_SCALE_GYM_ID,
  CUSTOM_V_SCALE_GYM_NAME,
  V_SCALE_GRADES,
} from '../src/gyms.js';

describe('custom V-scale gym catalog', () => {
  it('exposes a stable gym id and display name', () => {
    expect(CUSTOM_V_SCALE_GYM_ID).toBe('d0dad004-0004-4000-8000-000000000004');
    expect(CUSTOM_V_SCALE_GYM_NAME).toBe('Custom gym (V-scale)');
  });

  it('lists VB through V17 in order', () => {
    expect(V_SCALE_GRADES).toEqual([
      'VB',
      'V0-',
      'V0',
      'V0+',
      'V1',
      'V2',
      'V3',
      'V4',
      'V5',
      'V6',
      'V7',
      'V8',
      'V9',
      'V10',
      'V11',
      'V12',
      'V13',
      'V14',
      'V15',
      'V16',
      'V17',
    ]);
  });
});
