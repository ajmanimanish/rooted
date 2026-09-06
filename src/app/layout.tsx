import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import DemoDataBanner from "@/components/DemoDataBanner";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Rooted",
  description: "A trust-first community for people building a life somewhere new.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <DemoDataBanner />
        <NavBar />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
