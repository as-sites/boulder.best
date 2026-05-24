/** Standard Hueco V-scale grades for generic / custom gym sessions. */
export const V_SCALE_GRADES = [
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
] as const;

/** Stable catalog id for the generic V-scale gym seeded in Postgres. */
export const CUSTOM_V_SCALE_GYM_ID =
  'd0dad004-0004-4000-8000-000000000004' as const;

export const CUSTOM_V_SCALE_GYM_NAME = 'Custom gym (V-scale)';
