/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "images.openfoodfacts.org"
      },
      {
        protocol: "https",
        hostname: "images.openbeautyfacts.org"
      },
      {
        protocol: "https",
        hostname: "images.openproductsfacts.org"
      }
    ]
  }
};

export default nextConfig;
