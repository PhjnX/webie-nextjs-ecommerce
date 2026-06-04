import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "webie-vietnam1.odoo.com",
        port: "",
        pathname: "/web/image/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
