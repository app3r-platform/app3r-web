/**
 * jest.setup.ts — Global test setup for WeeeT
 * Sub-CMD-2 Wave 1 (based on Backend Lead template)
 */
import "@testing-library/jest-dom";

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Mock Next.js Image
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("react").createElement("img", { src, alt, ...props }),
}));

// Default env vars for tests
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";
process.env.NEXT_PUBLIC_WS_URL = "ws://localhost:8000";
