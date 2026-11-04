/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  remotePatterns: [
      {
        hostname: "hotapp-io-core-bucket.s3.ap-southeast-7.amazonaws.com",
        protocol: "https",
      },
    ],
  serverActions: {
    bodySizeLimit: "50mb",
  },
};

export default nextConfig;
