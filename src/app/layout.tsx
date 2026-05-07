import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Suler EMS",
  description: "Enterprise Management System",
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,300,0,0&display=swap" rel="stylesheet" />
        <style>{`
          .material-symbols-outlined {
            font-family: 'Material Symbols Rounded', sans-serif !important;
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          }
        `}</style>
      </head>
      <body className={`${inter.className} min-h-full flex flex-col bg-bg text-text-primary`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
