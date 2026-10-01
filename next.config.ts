import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Imágenes de rewards subidas por el admin: URL firmada del bucket S3
    // privado (prefijo rewards/), resuelta por el backend.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/rewards/**",
      },
    ],
  },
};

export default nextConfig;
