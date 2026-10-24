import type { Metadata } from "next";
import { Hind_Siliguri, Nunito, Space_Mono } from "next/font/google";
import "./globals.css";
import { SiteChrome } from '@/components/layout/SiteChrome';
import { CustomCursor } from '@/components/fx/CustomCursor';
import { ScrollProgress } from '@/components/fx/ScrollProgress';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

/* Bangla text (names, announcements) falls back to Hind Siliguri, which covers
   the Bengali script that Nunito lacks. Not preloaded: it downloads only when
   a page actually shows Bangla characters. */
const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-hind-siliguri',
  display: 'swap',
  preload: false,
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-spacemono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://accrc.pages.dev"),
  title: "ACCRC \u2014 Adamjee Cantonment College Robotics Club",
  description:
    "Build what's next with ACCRC \u2014 the student robotics club at Adamjee Cantonment College, Dhaka.",
  generator: "ACCRC",
  // The club logo, from public/. Named files (not src/app/favicon.ico) so a
  // new icon gets a new URL: browsers and Vercel's build cache both kept
  // serving the old /favicon.ico after it changed.
  icons: {
    icon: [
      { url: "/accrc-favicon.ico", sizes: "48x48" },
      { url: "/accrc-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/accrc-favicon.ico",
    apple: "/accrc-apple-icon.png",
  },
  openGraph: {
    title: "ACCRC \u2014 Adamjee Cantonment College Robotics Club",
    description:
      "Build what's next with ACCRC \u2014 the student robotics club at Adamjee Cantonment College, Dhaka.",
    url: "https://accrc.pages.dev",
    siteName: "ACCRC",
    locale: "en_US",
    type: "website",
    images: [{ url: "/accrc-logo.png", alt: "ACCRC logo" }],
  },
  twitter: {
    card: "summary",
    title: "ACCRC \u2014 Adamjee Cantonment College Robotics Club",
    description: "Build what's next with ACCRC \u2014 the student robotics club at Adamjee Cantonment College, Dhaka.",
    images: ["/accrc-logo.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${nunito.variable} ${spaceMono.variable} ${hindSiliguri.variable} cv-measure`}>
      <head>
        <meta name="theme-color" content="#F7F5EE" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1C1917" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light" />
        {/* Skip laying out offscreen sections from the first paint, unless the
            page was opened on a #link — then lay everything out so the jump
            lands exactly (see SiteChrome). Runs before the body renders. */}
        {/* Reloads and browser-restored tabs must land at the top of the page
            (the hero), never mid-page at the last section or an old #hash —
            that is what reads as "opened the wrong page" on phones. Sessions
            restored by the browser and reloading a tab are not deliberate
            deep-links, so they are reset to the top before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "var nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];\n" +
              "var restored=nav&&(nav.type==='reload'||nav.type==='back_forward');\n" +
              "if(restored){\n" +
              "try{history.scrollRestoration='manual'}catch(e){}\n" +
              "if(location.hash)history.replaceState(null,'',location.pathname+location.search);\n" +
              "scrollTo(0,0)\n" +
              "}\n" +
              "if(!location.hash)document.documentElement.classList.remove('cv-measure')",
          }}
        />
      </head>
      <body className="antialiased">
        <ScrollProgress />
        <CustomCursor />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
