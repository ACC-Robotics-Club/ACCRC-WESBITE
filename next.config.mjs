/* The site is a static export on every host, Vercel included. A Vercel
   server build (to run src/app/api/register/route.vercel.ts) failed to deploy
   every time, which also kept every later fix off the live site. Emails go
   from the browser through EmailJS instead (lib/clubEmail.ts); on Cloudflare
   Pages, functions/api/register.ts still serves /api/register. The
   `.vercel.ts` route is not a page extension here, so it is ignored. */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
