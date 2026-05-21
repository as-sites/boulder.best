ALTER TABLE "gyms" ADD COLUMN "locations" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
INSERT INTO "gyms" ("id", "name", "grades", "locations", "created_at", "updated_at")
VALUES (
  'b10c4a01-0001-4000-8000-000000000001',
  'Blochaus',
  ARRAY['Blue', 'Red', 'Purple', 'Black', 'Yellow', 'White', 'Joker'],
  ARRAY['Leichhardt', 'Marrickville'],
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "grades" = EXCLUDED."grades",
  "locations" = EXCLUDED."locations",
  "updated_at" = NOW();--> statement-breakpoint
INSERT INTO "gyms" ("id", "name", "grades", "locations", "created_at", "updated_at")
VALUES (
  '900d9e02-0002-4000-8000-000000000002',
  '9 Degrees',
  ARRAY[
    'Yellow (VE)',
    'Green (V0-)',
    'Blue (V0-V1)',
    'Teal (V1-V2)',
    'Pink (V2-V4)',
    'Orange (V4-V6)',
    'Purple (V5-V8)',
    'White (V7+)',
    'Black (Mixed)'
  ],
  ARRAY['Alexandria', 'Lane Cove', 'Waterloo', 'Chatswood', 'Parramatta'],
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "grades" = EXCLUDED."grades",
  "locations" = EXCLUDED."locations",
  "updated_at" = NOW();--> statement-breakpoint
INSERT INTO "gyms" ("id", "name", "grades", "locations", "created_at", "updated_at")
VALUES (
  '0e0ad003-0003-4000-8000-000000000003',
  'Nomad',
  ARRAY[
    'Blue',
    'Yellow',
    'Orange',
    'Green',
    'Purple',
    'Black',
    'Red',
    'Pink',
    'White/Wildcard'
  ],
  ARRAY['Annandale', 'Gladesville'],
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "grades" = EXCLUDED."grades",
  "locations" = EXCLUDED."locations",
  "updated_at" = NOW();
