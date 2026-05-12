/**
 * location.ts โ€” D90: Google Maps proxy + live location routes
 *
 * POST /api/v1/location/geocode            โ€” geocode address (cache 90 days)
 * POST /api/v1/location/distance           โ€” distance matrix (cache 7 days)
 * POST /api/v1/location/places-autocomplete โ€” Places API (session billing)
 * POST /api/v1/location/live               โ€” receive WeeeT lat/lng + WS broadcast (NOTE-SUB5)
 * GET  /api/v1/locations                   โ€” list user's saved locations
 * POST /api/v1/locations                   โ€” save new location
 *
 * NOTE-D90-2: roundCoord applied in all distance cache INSERT/SELECT
 * NOTE-SUB5: live location โ’ WS broadcast location.update { service_id, lat, lng, timestamp }
 * PDPA: เธ•เธณเนเธซเธเนเธเธเนเธฒเธ = personal data โ’ consent required before share
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { locations, distanceCache } from '../db/schema'
import { eq, and, lt } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'
import { googleMapsAdapter, roundCoord } from '../lib/maps'
import { wsRegistry, createWsEvent } from '../lib/websocket'

export const locationRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

// โ”€โ”€ POST /geocode โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const geocodeRoute = createRoute({
  method: 'post',
  path: '/geocode',
  tags: ['Location'],
  summary: 'Geocode address โ’ lat/lng (server proxy, cache 90 days) (D90)',
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: z.object({ address: z.string().min(1) }) } } },
  },
  responses: {
    200: {
      description: 'Geocode result',
      content: {
        'application/json': {
          schema: z.object({
            formattedAddress: z.string(),
            lat: z.number(),
            lng: z.number(),
            placeId: z.string(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

locationRouter.openapi(geocodeRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { address } = c.req.valid('json')
  const result = await googleMapsAdapter.geocode(address)
  return c.json(result, 200)
})

// โ”€โ”€ POST /distance โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const distanceRoute = createRoute({
  method: 'post',
  path: '/distance',
  tags: ['Location'],
  summary: 'Distance Matrix (server proxy, cache 7 days, NOTE-D90-2 round 6 decimals) (D90)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            originLat: z.number(),
            originLng: z.number(),
            destLat: z.number(),
            destLng: z.number(),
            mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).default('driving'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Distance result',
      content: {
        'application/json': {
          schema: z.object({
            distanceMeters: z.number(),
            durationSeconds: z.number(),
            distanceText: z.string(),
            durationText: z.string(),
            cached: z.boolean(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

locationRouter.openapi(distanceRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { originLat, originLng, destLat, destLng, mode } = c.req.valid('json')

  // NOTE-D90-2: round coords before cache lookup + API call
  const oLat = roundCoord(originLat)
  const oLng = roundCoord(originLng)
  const dLat = roundCoord(destLat)
  const dLng = roundCoord(destLng)

  // Check cache first
  const [cached] = await db
    .select()
    .from(distanceCache)
    .where(
      and(
        eq(distanceCache.originLat, oLat),
        eq(distanceCache.originLng, oLng),
        eq(distanceCache.destLat, dLat),
        eq(distanceCache.destLng, dLng),
        eq(distanceCache.mode, mode),
        lt(distanceCache.expiresAt, new Date()) ? undefined : undefined,
      ),
    )
    .limit(1)

  if (cached && new Date(cached.expiresAt) > new Date()) {
    return c.json({
      distanceMeters: cached.distanceMeters,
      durationSeconds: cached.durationSeconds,
      distanceText: `${(cached.distanceMeters / 1000).toFixed(1)} km`,
      durationText: `${Math.round(cached.durationSeconds / 60)} min`,
      cached: true,
    }, 200)
  }

  // Fetch from Google Maps API
  const result = await googleMapsAdapter.distance(oLat, oLng, dLat, dLng, mode)

  // Cache result (7 days TTL)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db
    .insert(distanceCache)
    .values({
      originLat: oLat, originLng: oLng,
      destLat: dLat, destLng: dLng,
      distanceMeters: result.distanceMeters,
      durationSeconds: result.durationSeconds,
      mode,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [distanceCache.originLat, distanceCache.originLng, distanceCache.destLat, distanceCache.destLng, distanceCache.mode],
      set: { distanceMeters: result.distanceMeters, durationSeconds: result.durationSeconds, cachedAt: new Date(), expiresAt },
    })

  return c.json({ ...result, cached: false }, 200)
})

// โ”€โ”€ POST /places-autocomplete โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const autocompleteRoute = createRoute({
  method: 'post',
  path: '/places-autocomplete',
  tags: ['Location'],
  summary: 'Places Autocomplete (session billing) (D90)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ input: z.string().min(1), sessionToken: z.string().optional() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Autocomplete results',
      content: {
        'application/json': {
          schema: z.object({
            predictions: z.array(z.object({
              placeId: z.string(),
              description: z.string(),
              mainText: z.string(),
              secondaryText: z.string(),
            })),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

locationRouter.openapi(autocompleteRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { input, sessionToken } = c.req.valid('json')
  const predictions = await googleMapsAdapter.placesAutocomplete(input, sessionToken)
  return c.json({ predictions }, 200)
})

// โ”€โ”€ POST /live (NOTE-SUB5) โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const liveLocationRoute = createRoute({
  method: 'post',
  path: '/live',
  tags: ['Location'],
  summary: 'WeeeT live location update โ’ WS broadcast to WeeeU subscriber (NOTE-SUB5)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            serviceId: z.string().uuid(),
            lat: z.number(),
            lng: z.number(),
            // subscriberUserId: WeeeU เธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเธฃเธฑเธ location update
            subscriberUserId: z.string().uuid(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Location broadcast sent' },
    401: { description: 'Unauthorized' },
  },
})

locationRouter.openapi(liveLocationRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { serviceId, lat, lng, subscriberUserId } = c.req.valid('json')

  // NOTE-SUB5: WS broadcast location.update event เนเธเธขเธฑเธ WeeeU subscriber
  // PDPA: เธ•เธณเนเธซเธเนเธเธเนเธฒเธ = personal data โ€” caller เธ•เนเธญเธ verify consent เธเนเธญเธ call endpoint เธเธตเน
  wsRegistry.emit(subscriberUserId, createWsEvent('location.update', {
    serviceId,
    lat: roundCoord(lat),
    lng: roundCoord(lng),
    timestamp: new Date().toISOString(),
  }))

  return c.json({ broadcast: true }, 200)
})

// โ”€โ”€ GET /locations โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const listLocationsRoute = createRoute({
  method: 'get',
  path: '/saved',
  tags: ['Location'],
  summary: 'List saved locations for current user (D90)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Saved locations',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({
              id: z.string(),
              label: z.string(),
              formattedAddress: z.string(),
              lat: z.number(),
              lng: z.number(),
            })),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

locationRouter.openapi(listLocationsRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const rows = await db
    .select()
    .from(locations)
    .where(eq(locations.ownerId, user.userId))

  return c.json({
    items: rows.map((l) => ({
      id: l.id,
      label: l.label,
      formattedAddress: l.formattedAddress,
      lat: l.latitude,
      lng: l.longitude,
    })),
  }, 200)
})

// โ”€โ”€ POST /locations โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const saveLocationRoute = createRoute({
  method: 'post',
  path: '/saved',
  tags: ['Location'],
  summary: 'Save new location (D90)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            ownerApp: z.string(),
            label: z.string(),
            formattedAddress: z.string(),
            province: z.string().optional(),
            district: z.string().optional(),
            lat: z.number(),
            lng: z.number(),
            googlePlaceId: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Location saved',
      content: { 'application/json': { schema: z.object({ id: z.string() }) } },
    },
    401: { description: 'Unauthorized' },
  },
})

locationRouter.openapi(saveLocationRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const body = c.req.valid('json')
  const [loc] = await db
    .insert(locations)
    .values({
      ownerId: user.userId,
      ownerApp: body.ownerApp,
      label: body.label,
      formattedAddress: body.formattedAddress,
      province: body.province ?? null,
      district: body.district ?? null,
      latitude: roundCoord(body.lat),
      longitude: roundCoord(body.lng),
      googlePlaceId: body.googlePlaceId ?? null,
    })
    .returning({ id: locations.id })

  return c.json({ id: loc.id }, 201)
})

