import type { NextConfig } from "next";

// Go-live guards — fail loud at build time, never silently in prod
if (process.env.NODE_ENV === "production") {
  if (!process.env.BACKEND_URL) {
    throw new Error(
      "[Admin] BACKEND_URL is required in production — set it in your deployment environment"
    );
  }
  if (process.env.NEXT_PUBLIC_DEV_NAV === "true") {
    throw new Error(
      "[Admin] NEXT_PUBLIC_DEV_NAV=true is forbidden in production — dev bypass must not reach prod"
    );
  }
}

const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
