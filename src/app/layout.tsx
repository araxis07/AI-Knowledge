import type { Metadata, Viewport } from "next";

import "./globals.css";

const metadataBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: {
    default: "AI Knowledge Base",
    template: "%s | AI Knowledge Base",
  },
  description:
    "Production-oriented scaffold for an AI knowledge base with semantic search and grounded answers.",
  applicationName: "AI Knowledge Base",
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f7fb",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
