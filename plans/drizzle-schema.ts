import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

// --- ENUMS ---
export const entryTypeEnum = pgEnum('entry_type', ['climb', 'break']);

// --- TABLES ---

export const gyms = pgTable('gyms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  // "Grade Scale Array": We can store the scale as a simple JSONB array or Postgres text array.
  // Example: ['V0', 'V1', 'V2'] or ['Yellow', 'Green', 'Blue']
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
    // Reference to better-auth user. better-auth typically uses text-based IDs.
    userId: text('user_id').notNull(),
    gymId: uuid('gym_id')
      .references(() => gyms.id)
      .notNull(),

    // The client dictates these times since it works offline using Temporal API
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),

    // Store the final computed duration in milliseconds so you don't have
    // to calculate it on the fly for dashboards.
    totalDurationMs: integer('total_duration_ms').notNull(),

    notes: text('notes'), // Optional overall session notes

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
    userId: text('user_id').notNull(), // Denormalized for easier querying/Row Level Security

    // CRITICAL: Maintains the exact order the user created them in the UI list
    sequenceOrder: integer('sequence_order').notNull(),

    type: entryTypeEnum('type').notNull(),

    // Final calculated time spent on this specific block
    durationMs: integer('duration_ms').notNull(),

    // --- CLIMB SPECIFIC FIELDS (Nullable for Breaks) ---
    name: varchar('name', { length: 255 }), // e.g., "Climb 1", "Pink corner route"
    grade: varchar('grade', { length: 50 }), // matches a value from the gym's grades array
    attempts: integer('attempts'), // defaults to 1 on client
    completed: boolean('completed'), // indicates a 'top'
    photoUrl: text('photo_url'), // URL to the Cloudflare R2 bucket blob
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

// --- RELATIONS (For Drizzle Query Builder) ---

export const gymsRelations = relations(gyms, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  gym: one(gyms, {
    fields: [sessions.gymId],
    references: [gyms.id],
  }),
  entries: many(sessionEntries),
}));

export const sessionEntriesRelations = relations(sessionEntries, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionEntries.sessionId],
    references: [sessions.id],
  }),
}));
