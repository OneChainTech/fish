declare module "next-pwa" {
  import type { NextConfig } from "next";

  export interface NextPWAOptions {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: Array<Record<string, unknown>>;
    buildExcludes?: RegExp[];
    fallbacks?: Record<string, string>;
    workboxOpts?: Record<string, unknown>;
  }

  export default function withPWA(options?: NextPWAOptions): (nextConfig: NextConfig) => NextConfig;
}
