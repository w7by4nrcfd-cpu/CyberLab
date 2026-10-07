import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      // This matcher also covers / in the current Vinext runtime.
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
  // CSP, frame restrictions and HSTS need hosted OAuth/embed/TLS verification
  // before enforcement. The dispatcher owns the reserved authentication routes.
};

export default nextConfig;
