import type { Metadata } from "next";
import "./globals.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import BackgroundAnimation from "../components/BackgroundAnimation";
import ScrollProgress from "../components/ScrollProgress";

export const metadata: Metadata = {
  title: "Rajat Kumar Pradhan | QA Automation Expert",
  description: "Crafting robust test automation frameworks with 3.6+ years of expertise in Selenium, Playwright, and modern testing practices. Leading teams to deliver flawless software experiences.",
  keywords: "QA Automation, Selenium, Playwright, Test Automation, Quality Assurance, Software Testing",
  authors: [{ name: "Rajat Kumar Pradhan" }],
  // viewport removed from metadata
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="smooth-scroll">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="gpu-accelerated">
        <BackgroundAnimation />
        <ScrollProgress />
        <Navigation />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}