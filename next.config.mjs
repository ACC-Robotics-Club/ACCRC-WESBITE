/* Vercel runs Next.js as a server, so the registration API route
   (src/app/api/register/route.vercel.ts) can send mail there. Everywhere
   else the site builds as a static export, and Cloudflare Pages deploys
   /out with functions/ serving the API. */
const onVercel = Boolean(process.env.VERCEL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(onVercel
    ? { pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'vercel.ts'] }
    : { output: 'export' }),
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
