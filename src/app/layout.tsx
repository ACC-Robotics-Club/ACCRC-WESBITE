import type { Metadata } from "next";
import { Nunito, Space_Mono } from "next/font/google";
import "./globals.css";
import { SiteChrome } from '@/components/layout/SiteChrome';
import { CustomCursor } from '@/components/fx/CustomCursor';
import { ScrollProgress } from '@/components/fx/ScrollProgress';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
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
  // favicon.ico is picked up from src/app automatically. The light/dark PNG
  // and SVG icons previously listed here never existed and 404'd on every load.
  icons: {
    apple: "/apple-icon.png",
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
    <html lang="en" className={`${nunito.variable} ${spaceMono.variable} cv-measure`}>
      <head>
        <meta name="theme-color" content="#F7F5EE" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1C1917" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />
        {/* Skip laying out offscreen sections from the first paint, unless the
            page was opened on a #link — then lay everything out so the jump
            lands exactly (see SiteChrome). Runs before the body renders. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "if(!location.hash)document.documentElement.classList.remove('cv-measure')",
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
