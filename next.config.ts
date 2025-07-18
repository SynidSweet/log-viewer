import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  
  // Enable React DevTools profiler in development
  reactStrictMode: true,
  
  // Enable profiling in development mode
  // This allows the React DevTools profiler to work optimally
  // Note: profiling is automatically enabled in development mode
  
  // Bundle optimization settings
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react", "date-fns"],
  },
};

export default withBundleAnalyzer(nextConfig);
