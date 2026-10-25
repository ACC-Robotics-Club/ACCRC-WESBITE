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
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
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
    <html lang="en" className={`${nunito.variable} ${spaceMono.variable}`}>
      <head>
        <meta name="theme-color" content="#F7F5EE" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1C1917" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="antialiased">
        <ScrollProgress />
        <CustomCursor />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
