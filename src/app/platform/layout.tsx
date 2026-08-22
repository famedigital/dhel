import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform admin — Dhel",
  robots: { index: false, follow: false },
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return children;
}
