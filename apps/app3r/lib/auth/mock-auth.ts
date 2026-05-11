// ============================================================
// lib/auth/mock-auth.ts — Mock role from cookie (Next.js 15 async cookies)
// Phase C-4.1b
// ============================================================
import { cookies } from 'next/headers';

export type MockRole = 'anonymous' | 'weeeu' | 'weeer' | 'weeet' | 'weeeu-owner' | 'admin';

const VALID_ROLES: MockRole[] = ['anonymous', 'weeeu', 'weeer', 'weeet', 'weeeu-owner', 'admin'];

export async function getMockRoleFromCookie(): Promise<MockRole> {
  const cookieStore = await cookies();
  const role = cookieStore.get('app3r-mock-role')?.value;
  if (role && VALID_ROLES.includes(role as MockRole)) {
    return role as MockRole;
  }
  return 'anonymous';
}
