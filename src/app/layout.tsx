import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Anonymous_Pro, Poppins } from "next/font/google";
import { Cabin_Sketch } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const cabinSketch = Cabin_Sketch({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-cabin-sketch",
  display: "swap",
});

const anonymousPro = Anonymous_Pro({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-anonymous-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chroma War",
  description: "A multiplayer chain reaction strategy game. Play against AI or friends online!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${cabinSketch.variable} ${anonymousPro.variable}`}>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="antialiased bg-secondary font-primary select-none">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
