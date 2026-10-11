
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "rilskaomilhhjhutabrp.supabase.co",
        pathname: "/storage/v1/object/public/catalog-images/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination:
          "https://clothingmart-api.onrender.com/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
