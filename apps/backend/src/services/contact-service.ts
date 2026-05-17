/**
 * services/contact-service.ts — Sub-4 D78: Contact Info + Form
 *
 * Business logic:
 *   - submitContact(): validate + insert contact_messages
 *   - getContactInfo(): fetch singleton contact_info row
 *   - listMessages(): admin list (filter deletedAt IS NULL)
 *   - getMessage(): admin single message
 *   - updateMessageStatus(): admin status change
 *   - softDeleteMessage(): SET deletedAt = now() (GAP-S1)
 *   - updateContactInfo(): upsert singleton row (ON CONFLICT key DO UPDATE)
 *
 * Rate limit: in-memory Map (5 req/IP/15min) — enforced at route layer
 *
 * Schema Plan: 363813ec-7277-81c2-b7b4-d9111d0b3427
 * Master CMD:  363813ec-7277-813c-ba73-e56b9695d828 (v4.2)
 */
import { db } from '../db/client'
import { contactMessages, contactInfo } from '../db/schema/contact'
import { eq, isNull, desc } from 'drizzle-orm'
import type {
  ContactMessageDto,
  ContactInfoDto,
  CreateContactMessageInput,
  UpdateContactStatusInput,
} from '../types/contact'

// ── Mapper: DB row → ContactMessageDto ───────────────────────────────────────
function mapMessageToDto(row: typeof contactMessages.$inferSelect): ContactMessageDto {
  return {
    id:        row.id,
    category:  row.category as ContactMessageDto['category'],
    name:      row.name,
    email:     row.email,
    phone:     row.phone ?? null,
    subject:   row.subject,
    body:      row.body,
    status:    row.status as ContactMessageDto['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    repliedAt: row.repliedAt?.toISOString() ?? null,
    repliedBy: row.repliedBy ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
  }
}

// ── Public: submit contact form ───────────────────────────────────────────────
export async function submitContact(input: CreateContactMessageInput): Promise<ContactMessageDto> {
  const [row] = await db
    .insert(contactMessages)
    .values({
      category: input.category,
      name:     input.name,
      email:    input.email,
      phone:    input.phone ?? null,
      subject:  input.subject,
      body:     input.body,
      status:   'new',
    })
    .returning()
  return mapMessageToDto(row)
}

// ── Public: get contact info (for Footer / Website) ───────────────────────────
export async function getContactInfo(): Promise<ContactInfoDto | null> {
  const [row] = await db
    .select()
    .from(contactInfo)
    .where(eq(contactInfo.key, 'platform'))
    .limit(1)
  if (!row) return null
  const data = row.data as unknown as ContactInfoDto
  return {
    ...data,
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ── Admin: list messages (exclude soft-deleted) ────────────────────────────────
export async function listMessages(): Promise<ContactMessageDto[]> {
  const rows = await db
    .select()
    .from(contactMessages)
    .where(isNull(contactMessages.deletedAt))
    .orderBy(desc(contactMessages.createdAt))
  return rows.map(mapMessageToDto)
}

// ── Admin: get single message ─────────────────────────────────────────────────
export async function getMessage(id: string): Promise<ContactMessageDto | null> {
  const [row] = await db
    .select()
    .from(contactMessages)
    .where(eq(contactMessages.id, id))
    .limit(1)
  if (!row) return null
  return mapMessageToDto(row)
}

// ── Admin: update message status ──────────────────────────────────────────────
export async function updateMessageStatus(
  id: string,
  input: UpdateContactStatusInput,
  repliedBy?: string,
): Promise<ContactMessageDto | null> {
  const now = new Date()
  const [row] = await db
    .update(contactMessages)
    .set({
      status:    input.status,
      updatedAt: now,
      ...(input.status === 'replied' ? { repliedAt: now, repliedBy: repliedBy ?? null } : {}),
    })
    .where(eq(contactMessages.id, id))
    .returning()
  if (!row) return null
  return mapMessageToDto(row)
}

// ── Admin: soft delete (GAP-S1) ───────────────────────────────────────────────
export async function softDeleteMessage(id: string): Promise<boolean> {
  const result = await db
    .update(contactMessages)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(contactMessages.id, id))
    .returning({ id: contactMessages.id })
  return result.length > 0
}

// ── Admin: update contact info (upsert singleton) ─────────────────────────────
export async function updateContactInfo(
  data: Omit<ContactInfoDto, 'updatedAt'>,
  updatedBy: string,
): Promise<ContactInfoDto> {
  const now = new Date()
  const [row] = await db
    .insert(contactInfo)
    .values({
      key:       'platform',
      data:      { ...data, updatedAt: now.toISOString() },
      updatedBy,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: contactInfo.key,
      set: {
        data:      { ...data, updatedAt: now.toISOString() },
        updatedBy,
        updatedAt: now,
      },
    })
    .returning()
  return {
    ...(row.data as ContactInfoDto),
    updatedAt: row.updatedAt.toISOString(),
  }
}
