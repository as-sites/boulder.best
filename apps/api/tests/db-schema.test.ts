import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getTableColumns, getTableName, isTable } from 'drizzle-orm';
import {
  climbAttempts,
  sessionEntries,
  sessionEntryImages,
  sessions,
} from '../src/db/schema.js';

const migrationsDir = join(import.meta.dirname, '../drizzle');

describe('app Drizzle schema', () => {
  it('keeps climbs and breaks in session_entries without legacy photo/attempt columns', () => {
    const columns = getTableColumns(sessionEntries);

    expect(columns.type).toBeDefined();
    expect(columns.sequenceOrder).toBeDefined();
    expect(columns.durationMs).toBeDefined();
    expect('photoUrl' in columns).toBe(false);
    expect('attempts' in columns).toBe(false);
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

  it('defines climb_attempts with per-entry sequence and bigint duration', () => {
    const columns = getTableColumns(climbAttempts);

    expect(getTableName(climbAttempts)).toBe('climb_attempts');
    expect(columns.entryId).toBeDefined();
    expect(columns.sequenceOrder).toBeDefined();
    expect(columns.durationMs).toBeDefined();
    expect(columns.durationMs.columnType).toMatch(/^PgBigInt/);
  });

  it('indexes sessions for user history queries', () => {
    expect(isTable(sessions)).toBe(true);
    expect(sessions.userId.name).toBe('user_id');
    expect(sessions.startTime.name).toBe('start_time');
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
});
