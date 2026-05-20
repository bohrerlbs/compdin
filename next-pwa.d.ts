declare module "next-pwa" {
  import { NextConfig } from "next"
  type PWAConfig = {
    dest: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    [key: string]: unknown
  }
  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export = withPWA
}
