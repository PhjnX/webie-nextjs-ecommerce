import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "webie-vietnam1.odoo.com",
        pathname: "/web/image/**",
      },
      {
        protocol: "https",
        hostname: "webievietnam.odoo.com",
        pathname: "/web/image/**",
      },
    ],
  },
};

export default nextConfig;