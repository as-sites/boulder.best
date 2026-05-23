import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getTableColumns, getTableName, isTable } from 'drizzle-orm';
import migrationJournal from '../drizzle/meta/_journal.json' with { type: 'json' };
import {
  climbAttempts,
  gyms,
  sessionEntries,
  sessionEntryImages,
  sessions,
} from '../src/db/schema.js';

const migrationsDir = join(import.meta.dirname, '../drizzle');

describe('app Drizzle schema', () => {
  it('keeps climbs and breaks in session_entries without legacy photo/attempt/completed columns', () => {
    const columns = getTableColumns(sessionEntries);

    expect(columns.type).toBeDefined();
    expect(columns.sequenceOrder).toBeDefined();
    expect(columns.durationMs).toBeDefined();
    expect('photoUrl' in columns).toBe(false);
    expect('attempts' in columns).toBe(false);
    expect('completed' in columns).toBe(false);
  });

  it('defines session_entry_images with lookup columns and stable index ordering', () => {
    const columns = getTableColumns(sessionEntryImages);

    expect(getTableName(sessionEntryImages)).toBe('session_entry_images');
    expect(columns.sessionId).toBeDefined();
    expect(columns.entryId).toBeDefined();
    expect(columns.userId).toBeDefined();
    expect(columns.imageIndex).toBeDefined();
    expect(columns.objectKey).toBeDefined();
    expect(columns.photoUrl).toBeDefined();
    expect(columns.contentType).toBeDefined();
    expect(columns.contentLength).toBeDefined();
  });

  it('defines climb_attempts with per-entry sequence, bigint duration, and completed flag', () => {
    const columns = getTableColumns(climbAttempts);

    expect(getTableName(climbAttempts)).toBe('climb_attempts');
    expect(columns.entryId).toBeDefined();
    expect(columns.sequenceOrder).toBeDefined();
    expect(columns.durationMs).toBeDefined();
    expect(columns.durationMs.columnType).toMatch(/^PgBigInt/);
    expect(columns.completed).toBeDefined();
  });

  it('indexes sessions for user history queries', () => {
    expect(isTable(sessions)).toBe(true);
    expect(sessions.userId.name).toBe('user_id');
    expect(sessions.startTime.name).toBe('start_time');
  });

  it('defines gyms with grades and locations arrays', () => {
    const columns = getTableColumns(gyms);

    expect(getTableName(gyms)).toBe('gyms');
    expect(columns.grades).toBeDefined();
    expect(columns.locations).toBeDefined();
  });
});

describe('app Drizzle migrations', () => {
  it('includes a migration that adds images and attempts tables', () => {
    const sql = readFileSync(
      join(migrationsDir, '0001_session_entry_images_and_climb_attempts.sql'),
      'utf8',
    );

    expect(sql).toContain('CREATE TABLE "session_entry_images"');
    expect(sql).toContain('CREATE TABLE "climb_attempts"');
    expect(sql).toContain('DROP COLUMN "photo_url"');
    expect(sql).toContain('DROP COLUMN "attempts"');
    expect(sql).toContain('entry_images_entry_index_idx');
    expect(sql).toContain('climb_attempts_entry_id_idx');
    expect(sql).toContain('sessions_user_start_time_idx');
  });

  it('includes a migration that moves completed from session_entries to climb_attempts', () => {
    const sql = readFileSync(
      join(migrationsDir, '0005_move_completed_to_attempt.sql'),
      'utf8',
    );

    expect(sql).toContain(
      'ALTER TABLE "climb_attempts" ADD COLUMN "completed" boolean',
    );
    expect(sql).toContain('UPDATE "climb_attempts"');
    expect(sql).toContain(
      'ALTER TABLE "session_entries" DROP COLUMN "completed"',
    );
  });

  it('registers the completed migration in the drizzle journal', () => {
    expect(migrationJournal.entries.map((entry) => entry.tag)).toContain(
      '0005_move_completed_to_attempt',
    );
  });

  it('seeds the Sydney gym catalog with locations in migration 0003', () => {
    const sql = readFileSync(
      join(migrationsDir, '0003_omniscient_landau.sql'),
      'utf8',
    );

    expect(sql).toContain('ADD COLUMN "locations"');
    expect(sql).toContain("'b10c4a01-0001-4000-8000-000000000001'");
    expect(sql).toContain("'Blochaus'");
    expect(sql).toContain("ARRAY['Leichhardt', 'Marrickville']");
    expect(sql).toContain("'9 Degrees'");
    expect(sql).toContain(
      "ARRAY['Alexandria', 'Lane Cove', 'Waterloo', 'Chatswood', 'Parramatta']",
    );
    expect(sql).toContain("'Nomad'");
    expect(sql).toContain("ARRAY['Annandale', 'Gladesville']");
    expect(sql).toContain('ON CONFLICT ("id") DO UPDATE');
  });
});
