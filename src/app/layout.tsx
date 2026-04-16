import type { Metadata } from "next";
import "@/app/globals.css";
import AppProviders from "@/components/AppProviders";

const siteUrl = "https://myisdn.vercel.app";
const shareImagePath = "/og-image-whatsapp.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: "ISDN | IslandLink Sales Distribution Network",
  description:
    "Centralized web platform for island-wide sales, distribution, logistics, and reporting.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },

  // Open Graph (WhatsApp, Facebook, LinkedIn)
  openGraph: {
    title: "ISDN | IslandLink Sales Distribution Network",
    description: "Smart Distribution, Real-Time Tracking, Seamless Orders",
    url: siteUrl,
    siteName: "ISDN",
    images: [
      {
        url: shareImagePath,
        width: 1200,
        height: 630,
        alt: "ISDN Preview",
        type: "image/jpeg",
      },
    ],
    type: "website",
  },

  // Twitter preview
  twitter: {
    card: "summary_large_image",
    title: "ISDN | IslandLink",
    description: "Smart Distribution, Real-Time Tracking, Seamless Orders",
    images: [shareImagePath],
  },

  other: {
    "og:image:secure_url": `${siteUrl}${shareImagePath}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
