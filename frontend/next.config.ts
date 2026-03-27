import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare deployment — the app is fully client-side
  // so no server features are lost. Output goes to the `out/` directory.
  // output: "export",
};

export default nextConfig;


