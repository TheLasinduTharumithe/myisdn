import type { Metadata } from "next";
import "@/app/globals.css";
import AppProviders from "@/components/AppProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://myisdn.vercel.app"),

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
    url: "https://myisdn.vercel.app",
    siteName: "ISDN",
    images: [
      {
        url: "/og-image.png", // must be inside /public
        width: 1200,
        height: 630,
        alt: "ISDN Preview",
      },
    ],
    type: "website",
  },

  // Twitter preview
  twitter: {
    card: "summary_large_image",
    title: "ISDN | IslandLink",
    description: "Smart Distribution, Real-Time Tracking, Seamless Orders",
    images: ["/og-image.png"],
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
