import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "DAOputer",
  description: "Decentralized Computation Governance Platform",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'DAOputer',
    description: 'Decentralized Computation Governance Platform',
    type: 'website',
  },
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" className="dark">
      <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 min-h-screen`}
      >
      {children}
      </body>
      </html>
  );
}
