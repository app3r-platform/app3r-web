/**
 * jest.setup.ts — Global test setup
 * Sub-CMD-2 Wave 1 Template (App3R)
 */
import '@testing-library/jest-dom'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

// Mock Next.js Image (ไม่ต้องการ actual image optimization)
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').createElement('img', { src, alt, ...props }),
}))

// Default env vars สำหรับ test
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000'
// หมายเหตุ: NODE_ENV ถูกตั้งเป็น 'test' โดย jest อัตโนมัติ — ไม่ต้องตั้งซ้ำ
