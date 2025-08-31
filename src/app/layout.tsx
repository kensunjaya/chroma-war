import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Anonymous_Pro, Poppins, Potta_One } from "next/font/google";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const pottaOne = Potta_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-potta-one",
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
    <html lang="en" className={`${poppins.variable} ${pottaOne.variable} ${anonymousPro.variable}`}>
      <head>
        <link rel="icon" href="/favicon.webp" type="image/webp" />
      </head>
      <body className="antialiased bg-secondary font-primary select-none">
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          transition={Slide}
          toastStyle={{ fontFamily: 'var(--font-primary)' }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
