import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supreme Court AI Case Explorer",
  description: "AI-assisted semantic search for Indian Supreme Court landmark cases",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
