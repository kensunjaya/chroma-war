import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Chroma War",
  description: "An online multiplayer game consisting of 2 or more players.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body
        className='antialiased bg-secondary select-none'
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
