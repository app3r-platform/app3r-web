/**
 * db/schema/content.ts — Phase D-4 Sub-3: Platform Content CMS
 *
 * Tables: content_pages + content_images + content_versions
 * CMD: 362813ec-7277-8145-8148-ddd74c4222d2
 * Schema Plan: 362813ec-7277-81be-b041-e669c1b24b77
 */
import { pgTable, uuid, text, integer, jsonb, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const contentPages = pgTable(
  'content_pages',
  {
    id:          uuid('id').primaryKey().defaultRandom(),
    slug:        text('slug').notNull(),
    type:        text('type').notNull(),                       // 'hero' | 'about' | 'faq' | 'static'
    title:       text('title').notNull(),
    body:        jsonb('body').notNull().default({}),
    status:      text('status').notNull().default('draft'),
    version:     integer('version').notNull().default(1),
    authorId:    uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('uq_content_slug').on(t.slug),
    index('idx_content_slug_status').on(t.slug, t.status),
    index('idx_content_type_status').on(t.type, t.status),
  ],
)

export const contentImages = pgTable(
  'content_images',
  {
    id:            uuid('id').primaryKey().defaultRandom(),
    contentPageId: uuid('content_page_id').notNull()
                     .references(() => contentPages.id, { onDelete: 'cascade' }),
    url:           text('url').notNull(),
    r2Key:         text('r2_key').notNull(),
    alt:           text('alt'),
    caption:       text('caption'),
    order:         integer('order').notNull().default(0),
    createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_content_images_page').on(t.contentPageId),
  ],
)

export const contentVersions = pgTable(
  'content_versions',
  {
    id:            uuid('id').primaryKey().defaultRandom(),
    contentPageId: uuid('content_page_id').notNull()
                     .references(() => contentPages.id, { onDelete: 'cascade' }),
    version:       integer('version').notNull(),
    body:          jsonb('body').notNull(),
    publishedAt:   timestamp('published_at', { withTimezone: true }),
    authorId:      uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('uq_content_version').on(t.contentPageId, t.version),
    index('idx_content_versions_page').on(t.contentPageId),
  ],
)
