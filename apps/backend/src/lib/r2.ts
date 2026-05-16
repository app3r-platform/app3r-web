/**
 * r2.ts — D87: Cloudflare R2 file storage adapter
 *
 * R2 ใช้ AWS S3 API (S3-compatible) — ใช้ @aws-sdk/client-s3
 * Buckets: app3r-dev / app3r-staging / app3r-prod (separate)
 *
 * FileStorageAdapter interface = abstraction layer
 * → swap to local disk / S3 / GCS ได้ในอนาคต
 *
 * Upload limits: 10MB image / 50MB document
 */
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// ---------------------------------------------------------------------------
// FileStorageAdapter interface
// ---------------------------------------------------------------------------
export interface PresignPutResult {
  uploadUrl: string
  r2Key: string
  expiresIn: number
}

export interface FileStorageAdapter {
  presignPut(r2Key: string, mimeType: string, expiresIn?: number): Promise<PresignPutResult>
  presignGet(r2Key: string, expiresIn?: number): Promise<string>
  delete(r2Key: string): Promise<void>
  putObject(r2Key: string, body: Uint8Array | Buffer, contentType: string): Promise<void>
}

// ---------------------------------------------------------------------------
// R2 Client (lazy init — credentials from env)
// ---------------------------------------------------------------------------
let _client: S3Client | null = null

function getR2Client(): S3Client {
  if (_client) return _client
  _client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT ?? 'https://placeholder.r2.cloudflarestorage.com',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? 'placeholder-key',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? 'placeholder-secret',
    },
  })
  return _client
}

const BUCKET = process.env.R2_BUCKET ?? 'app3r-dev'
const DEFAULT_PRESIGN_TTL = 900 // 15 minutes

// ---------------------------------------------------------------------------
// R2 FileStorageAdapter implementation
// ---------------------------------------------------------------------------
export const r2Adapter: FileStorageAdapter = {
  async presignPut(r2Key: string, mimeType: string, expiresIn = DEFAULT_PRESIGN_TTL): Promise<PresignPutResult> {
    const client = getR2Client()
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      ContentType: mimeType,
    })
    const uploadUrl = await getSignedUrl(client, command, { expiresIn })
    return { uploadUrl, r2Key, expiresIn }
  },

  async presignGet(r2Key: string, expiresIn = DEFAULT_PRESIGN_TTL): Promise<string> {
    const client = getR2Client()
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: r2Key })
    return getSignedUrl(client, command, { expiresIn })
  },

  async delete(r2Key: string): Promise<void> {
    const client = getR2Client()
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: r2Key }))
  },

  async putObject(r2Key: string, body: Uint8Array | Buffer, contentType: string): Promise<void> {
    const client = getR2Client()
    await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: r2Key, Body: body, ContentType: contentType }))
  },
}

// ---------------------------------------------------------------------------
// Helper: generate R2 key
// ---------------------------------------------------------------------------
export function generateR2Key(ownerId: string, purpose: string, fileName: string): string {
  const timestamp = Date.now()
  const ext = fileName.split('.').pop() ?? 'bin'
  return `${purpose}/${ownerId}/${timestamp}.${ext}`
}
