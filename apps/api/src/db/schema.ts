import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const entryTypeEnum = pgEnum('entry_type', ['climb', 'break']);

export const gyms = pgTable('gyms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  grades: text('grades').array().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    gymId: uuid('gym_id')
      .references(() => gyms.id)
      .notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    totalDurationMs: integer('total_duration_ms').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_gym_id_idx').on(table.gymId),
    index('sessions_user_start_time_idx').on(table.userId, table.startTime),
  ],
);

export const sessionEntries = pgTable(
  'session_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .references(() => sessions.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id').notNull(),
    sequenceOrder: integer('sequence_order').notNull(),
    type: entryTypeEnum('type').notNull(),
    durationMs: integer('duration_ms').notNull(),
    name: varchar('name', { length: 255 }),
    grade: varchar('grade', { length: 50 }),
    completed: boolean('completed'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('entries_session_id_idx').on(table.sessionId),
    index('entries_user_id_idx').on(table.userId),
    index('entries_session_sequence_idx').on(
      table.sessionId,
      table.sequenceOrder,
    ),
  ],
);

export const sessionEntryImages = pgTable(
  'session_entry_images',
  {
    id: uuid('id').primaryKey(),
    sessionId: uuid('session_id')
      .references(() => sessions.id, { onDelete: 'cascade' })
      .notNull(),
    entryId: uuid('entry_id')
      .references(() => sessionEntries.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id').notNull(),
    imageIndex: integer('index').notNull(),
    objectKey: text('object_key').notNull(),
    photoUrl: text('photo_url').notNull(),
    contentType: varchar('content_type', { length: 50 }).notNull(),
    contentLength: integer('content_length').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('entry_images_session_id_idx').on(table.sessionId),
    index('entry_images_entry_id_idx').on(table.entryId),
    index('entry_images_user_id_idx').on(table.userId),
    index('entry_images_entry_index_idx').on(table.entryId, table.imageIndex),
  ],
);

export const climbAttempts = pgTable(
  'climb_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entryId: uuid('entry_id')
      .references(() => sessionEntries.id, { onDelete: 'cascade' })
      .notNull(),
    sequenceOrder: integer('sequence_order').notNull(),
    durationMs: bigint('duration_ms', { mode: 'number' }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('climb_attempts_entry_id_idx').on(table.entryId),
    index('climb_attempts_entry_sequence_idx').on(
      table.entryId,
      table.sequenceOrder,
    ),
  ],
);

export const gymsRelations = relations(gyms, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  gym: one(gyms, { fields: [sessions.gymId], references: [gyms.id] }),
  entries: many(sessionEntries),
  images: many(sessionEntryImages),
}));

export const sessionEntriesRelations = relations(
  sessionEntries,
  ({ one, many }) => ({
    session: one(sessions, {
      fields: [sessionEntries.sessionId],
      references: [sessions.id],
    }),
    images: many(sessionEntryImages),
    attempts: many(climbAttempts),
  }),
);

export const sessionEntryImagesRelations = relations(
  sessionEntryImages,
  ({ one }) => ({
    session: one(sessions, {
      fields: [sessionEntryImages.sessionId],
      references: [sessions.id],
    }),
    entry: one(sessionEntries, {
      fields: [sessionEntryImages.entryId],
      references: [sessionEntries.id],
    }),
  }),
);

export const climbAttemptsRelations = relations(climbAttempts, ({ one }) => ({
  entry: one(sessionEntries, {
    fields: [climbAttempts.entryId],
    references: [sessionEntries.id],
  }),
}));
