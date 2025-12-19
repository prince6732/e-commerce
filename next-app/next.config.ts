import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  eslint:{
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "localhost",
      "www.api.zelton.co.in"
    ],
  },
}; 
export default nextConfig;
