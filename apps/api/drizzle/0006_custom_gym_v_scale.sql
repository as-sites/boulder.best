INSERT INTO "gyms" ("id", "name", "grades", "locations", "created_at", "updated_at")
VALUES (
  'd0dad004-0004-4000-8000-000000000004',
  'Custom gym (V-scale)',
  ARRAY[
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
    'V17'
  ],
  ARRAY[]::text[],
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "grades" = EXCLUDED."grades",
  "locations" = EXCLUDED."locations",
  "updated_at" = NOW();
