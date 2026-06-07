UPDATE "gyms"
SET
  "grades" = ARRAY[
    'Basic Blue (VB)',
    'Easy Blue (V0)',
    'Hard Blue (V1)',
    'Easy Red (V1)',
    'Medium Red (V2)',
    'Hard Red (V3)',
    'Easy Purple (V3)',
    'Medium Purple (V4)',
    'Hard Purple (V5)',
    'Easy Black (V5)',
    'Medium Black (V6)',
    'Hard Black (V7)',
    'Easy Yellow (V7)',
    'Medium Yellow (V8)',
    'Hard Yellow (V9)'
  ],
  "updated_at" = NOW()
WHERE "id" = 'b10c4a01-0001-4000-8000-000000000001';--> statement-breakpoint
UPDATE "gyms"
SET
  "grades" = ARRAY[
    'Basic Blue (VB)',
    'Easy Blue (V0)',
    'Hard Blue (V1)',
    'Easy Yellow (V1)',
    'Hard Yellow (V2)',
    'Easy Orange (V2)',
    'Hard Orange (V3)',
    'Easy Green (V3)',
    'Hard Green (V4)',
    'Easy Purple (V5)',
    'Hard Purple (V6)',
    'Easy Black (V7)',
    'Hard Black (V8)',
    'Easy Red (V9)',
    'Hard Red (V10)'
  ],
  "updated_at" = NOW()
WHERE "id" = '0e0ad003-0003-4000-8000-000000000003';--> statement-breakpoint
UPDATE "gyms"
SET
  "grades" = ARRAY[
    'Yellow (VB)',
    'Easy Green (V0)',
    'Hard Green (V1)',
    'Easy Blue (V1)',
    'Hard Blue (V2)',
    'Easy Teal (V3)',
    'Hard Teal (V4)',
    'Easy Pink (V5)',
    'Hard Pink (V6)',
    'Easy Orange (V6)',
    'Hard Orange (V7)',
    'Easy Purple (V8)',
    'Hard Purple (V9)',
    'Easy White (V10)',
    'Hard White (V11)'
  ],
  "updated_at" = NOW()
WHERE "id" = '900d9e02-0002-4000-8000-000000000002';
