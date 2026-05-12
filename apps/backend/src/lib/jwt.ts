/**
 * jwt.ts — D83: JWT access token (15 min) + jose library
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { env } from '../env'

const secret = new TextEncoder().encode(env.JWT_SECRET)

export interface AccessTokenPayload extends JWTPayload {
  userId: string
  email: string
  role: string
}

export async function signAccessToken(
  payload: Pick<AccessTokenPayload, 'userId' | 'email' | 'role'>,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_MINUTES}m`)
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as AccessTokenPayload
}
