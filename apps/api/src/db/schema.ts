import { relations } from 'drizzle-orm';
import {
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
    attempts: integer('attempts'),
    completed: boolean('completed'),
    photoUrl: text('photo_url'),
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
  ],
);

export const gymsRelations = relations(gyms, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  gym: one(gyms, { fields: [sessions.gymId], references: [gyms.id] }),
  entries: many(sessionEntries),
}));

export const sessionEntriesRelations = relations(sessionEntries, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionEntries.sessionId],
    references: [sessions.id],
  }),
}));
