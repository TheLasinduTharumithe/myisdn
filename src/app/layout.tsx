import type { Metadata } from "next";
import "@/app/globals.css";
import AppProviders from "@/components/AppProviders";

export const metadata: Metadata = {
  title: "ISDN | IslandLink Sales Distribution Network",
  description:
    "Centralized web platform for island-wide sales, distribution, logistics, and reporting.",

  // Open Graph (WhatsApp, Facebook, LinkedIn)
  openGraph: {
    title: "ISDN | IslandLink Sales Distribution Network",
    description:
      "Smart Distribution, Real-Time Tracking, Seamless Orders",
    url: "https://your-domain.com", // 🔁 replace with your real domain later
    siteName: "ISDN",
    images: [
      {
        url: "/og-image.png", // 👈 make sure this is in /public
        width: 1200,
        height: 630,
        alt: "ISDN Preview",
      },
    ],
    type: "website",
  },

  // Twitter / X preview
  twitter: {
    card: "summary_large_image",
    title: "ISDN | IslandLink",
    description:
      "Smart Distribution, Real-Time Tracking, Seamless Orders",
    images: ["/og-image.png"],
  },

  // Optional but recommended
  metadataBase: new URL("https://your-domain.com"), // 🔁 replace later
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