/**
 * maps.ts — D90: Google Maps Platform proxy adapter
 *
 * Server-side proxy pattern:
 * - ปกป้อง API key — ไม่ให้หลุดใน client
 * - Cache shared ทุก user (geocode 90 วัน, distance 7 วัน)
 * - Rate limit: 100 req/min/user (enforce ใน route middleware)
 *
 * NOTE-D90-2: distance_cache round lat/lng 6 decimals ก่อน INSERT + SELECT
 * roundCoord ใช้ทุกที่ที่ deal กับ lat/lng cache
 *
 * APIs used:
 * - Geocoding API (server-side)
 * - Distance Matrix API (server-side + cache)
 * - Places Autocomplete (session token billing)
 * - Directions API (cache 1 hr)
 *
 * Maps JS API ใช้ client-side ตรง (HTTP referrer restriction key)
 * PostGIS GIST index defer Y2+ — ใช้ Haversine SQL ใน D-2
 *
 * Live location: POST /api/location/live (NOTE-SUB5)
 * → store latest position + broadcast WS location.update
 * PDPA: ตำแหน่งช่าง = personal data → require consent ก่อน share
 */
import { Client, TravelMode, UnitSystem } from '@googlemaps/google-maps-services-js'

// ---------------------------------------------------------------------------
// LocationService interface (Adapter pattern — swap to Mapbox Y5+)
// ---------------------------------------------------------------------------
export interface GeocodeResult {
  formattedAddress: string
  lat: number
  lng: number
  placeId: string
}

export interface DistanceResult {
  distanceMeters: number
  durationSeconds: number
  distanceText: string
  durationText: string
}

export interface PlaceAutocompleteResult {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

export interface LocationServiceAdapter {
  geocode(address: string): Promise<GeocodeResult>
  distance(
    originLat: number, originLng: number,
    destLat: number, destLng: number,
    mode?: string
  ): Promise<DistanceResult>
  placesAutocomplete(input: string, sessionToken?: string): Promise<PlaceAutocompleteResult[]>
}

// ---------------------------------------------------------------------------
// NOTE-D90-2: round lat/lng to 6 decimal places before cache INSERT/SELECT
// ---------------------------------------------------------------------------
export const roundCoord = (n: number): number => Math.round(n * 1e6) / 1e6

// ---------------------------------------------------------------------------
// Google Maps adapter implementation
// ---------------------------------------------------------------------------
let _mapsClient: Client | null = null

function getMapsClient(): Client {
  if (_mapsClient) return _mapsClient
  _mapsClient = new Client({})
  return _mapsClient
}

const GOOGLE_MAPS_KEY = () => process.env.GOOGLE_MAPS_SERVER_KEY ?? ''

export const googleMapsAdapter: LocationServiceAdapter = {
  async geocode(address: string): Promise<GeocodeResult> {
    const client = getMapsClient()
    const res = await client.geocode({
      params: { address, key: GOOGLE_MAPS_KEY() },
    })
    const result = res.data.results[0]
    if (!result) throw new Error('Geocoding returned no results')
    return {
      formattedAddress: result.formatted_address,
      lat: roundCoord(result.geometry.location.lat),
      lng: roundCoord(result.geometry.location.lng),
      placeId: result.place_id,
    }
  },

  async distance(
    originLat: number, originLng: number,
    destLat: number, destLng: number,
    mode = 'driving'
  ): Promise<DistanceResult> {
    // NOTE-D90-2: round coords before API call (same as cache key)
    const oLat = roundCoord(originLat)
    const oLng = roundCoord(originLng)
    const dLat = roundCoord(destLat)
    const dLng = roundCoord(destLng)

    const client = getMapsClient()
    const res = await client.distancematrix({
      params: {
        origins: [{ lat: oLat, lng: oLng }],
        destinations: [{ lat: dLat, lng: dLng }],
        mode: mode as TravelMode,
        units: UnitSystem.metric,
        key: GOOGLE_MAPS_KEY(),
      },
    })
    const element = res.data.rows[0]?.elements[0]
    if (!element || element.status !== 'OK') {
      throw new Error(`Distance Matrix failed: ${element?.status ?? 'unknown'}`)
    }
    return {
      distanceMeters: element.distance.value,
      durationSeconds: element.duration.value,
      distanceText: element.distance.text,
      durationText: element.duration.text,
    }
  },

  async placesAutocomplete(
    input: string,
    _sessionToken?: string
  ): Promise<PlaceAutocompleteResult[]> {
    const client = getMapsClient()
    const res = await client.placeAutocomplete({
      params: {
        input,
        language: 'th' as unknown as string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        components: { country: 'th' } as any,
        key: GOOGLE_MAPS_KEY(),
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.data.predictions.map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting.main_text,
      secondaryText: p.structured_formatting.secondary_text ?? '',
    }))
  },
}
