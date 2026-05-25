/**
 * asset-url.ts — D89 canonical: getAssetUrl() helper
 *
 * Abstract URL resolver for reference/master images (asset_images table).
 * Supports:
 *   - Local dev: returns /assets/<path> (relative to public/)
 *   - Production: returns cloud_url (Cloudflare R2 master bucket)
 *
 * Usage:
 *   getAssetUrl(row)               — full AssetImage row (prefers cloud_url)
 *   getAssetUrl({ localPath })     — local path only (always local)
 *
 * D89 spec: 36a813ec-7277-8132-9cb3-de95b1dabc49
 * Backend Gen — 2026-05-25
 */

import { env } from '../env'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AssetUrlInput {
  /** local path stored in asset_images.local_path — e.g. /assets/parts/ac-02-evaporator-coil.jpeg */
  localPath: string
  /** R2 cloud URL (NULL in dev, populated in production) */
  cloudUrl?: string | null
}

// ── Core helper ────────────────────────────────────────────────────────────────

/**
 * Returns the correct URL for a reference/master image.
 *
 * Resolution order:
 *   1. If cloud_url is set → return cloud_url (production R2)
 *   2. Otherwise → return local_path (dev static file)
 *
 * Note: local_path is relative to the web root (e.g. /assets/parts/...).
 *       In production the path is irrelevant once cloud_url is populated.
 */
export function getAssetUrl(asset: AssetUrlInput): string {
  // Production: use R2 cloud URL if available
  if (asset.cloudUrl) {
    return asset.cloudUrl
  }

  // Development: serve from local public/ folder
  // localPath is stored as /assets/... (absolute web path)
  return asset.localPath
}

/**
 * Build local_path string from category + filename.
 * Convention: /assets/<category>/<filename>
 *
 * Example: buildAssetLocalPath('parts', 'ac-02-evaporator-coil.jpeg')
 *          → '/assets/parts/ac-02-evaporator-coil.jpeg'
 */
export function buildAssetLocalPath(category: string, filename: string): string {
  // Sanitize: remove leading slashes from filename
  const clean = filename.replace(/^\/+/, '')
  return `/assets/${category}/${clean}`
}

/**
 * Build canonical filename from D89 naming convention:
 * <applianceCategory>-<partNumber>-<slug>.jpeg
 *
 * Example: buildAssetFilename('ac', '02', 'evaporator-coil') → 'ac-02-evaporator-coil.jpeg'
 * Example: buildAssetFilename('fridge', '03', 'Compressor Unit') → 'fridge-03-compressor-unit.jpeg'
 */
export function buildAssetFilename(
  applianceCategory: string,
  partNumber: string | number,
  slug: string,
  ext: string = 'jpeg',
): string {
  const normalizedSlug = slug
    .toLowerCase()
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/[^\w-]/g, '')         // remove non-word chars
    .replace(/-+/g, '-')            // collapse double hyphens
    .replace(/^-|-$/g, '')          // trim leading/trailing hyphens

  const paddedNum = String(partNumber).padStart(2, '0')
  return `${applianceCategory}-${paddedNum}-${normalizedSlug}.${ext}`
}

/**
 * Check if asset URL is local (dev) or remote (production).
 * Useful for conditional caching strategy.
 */
export function isLocalAsset(url: string): boolean {
  return url.startsWith('/assets/')
}

/**
 * Get public assets base URL (for constructing absolute URLs in API responses).
 * In production this returns the R2 public base URL prefix.
 * In dev this returns '' (empty — relative paths served by Hono static middleware).
 */
export function getAssetBaseUrl(): string {
  // Check if R2 public URL is configured (production)
  // env.R2_PUBLIC_URL would be something like 'https://assets.app3r.com'
  const r2Public = process.env.R2_ASSETS_PUBLIC_URL ?? ''
  return r2Public
}
