import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: "Water Invader - Save the Earth!",
  description: "A fast-paced retro 8-bit space shooter where you play as a cute water droplet defending against pollution fireballs!",
  openGraph: {
    title: "Water Invader",
    description: "Save the Earth from pollution in this retro arcade shooter!",
    url: "https://water-invader.vercel.app",
    siteName: "Water Invader",
    images: [
      {
        url: "/og-image.jpg", // Must point to public folder
        width: 1200,
        height: 630,
        alt: "Water Invader Game Banner",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Water Invader",
    description: "Save the Earth from pollution in this retro arcade shooter!",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/icon.jpg",
    apple: "/icon.jpg",
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
