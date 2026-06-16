/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "10.81.234.3",
    "192.168.10.206",
    "192.168.2.201",
    "10.81.234.2",
    "10.81.234.130",
    "steadying-encourage-equator.ngrok-free.dev",
  ],
};

export default nextConfig;
