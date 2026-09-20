import type { Metadata } from "next";
import "./globals.css";
import "./pink.css";

export const metadata: Metadata = {
  title: "Little Wishes — A world made for them",
  description:
    "Create a birthday surprise they’ll never forget. Personal photos, heartfelt words, and beautiful interactive worlds.",
  openGraph: {
    title: "Little Wishes — A world made for them",
    description: "A personal birthday experience, made with love.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
