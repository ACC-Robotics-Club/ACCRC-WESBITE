/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages deploys the generated static site from /out.
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  turbopack: {
    // Keep module resolution inside this checkout instead of selecting an
    // unrelated lockfile from a parent directory.
    root: process.cwd(),
  },
};

export default nextConfig;
