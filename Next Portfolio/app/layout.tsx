import type { Metadata } from "next";
import "./globals.css";
import Navigation from "../components/Navigation";
import ScrollProgress from "../components/ScrollProgress";
import BackgroundAnimation from "../components/BackgroundAnimation";

export const metadata: Metadata = {
  title: "Rajat Kumar Pradhan | QE Automation Expert & Senior SDET",
  description: "Senior SDET specializing in scalable Playwright/Selenium frameworks, Jest/Axios API automation, and backend systems validation.",
  keywords: "SDET, QE Automation, Quality Engineering, Playwright, Selenium, Jest, Axios, Kafka, Redis, MongoDB",
  authors: [{ name: "Rajat Kumar Pradhan" }],
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
    <html lang="en">
      <body>
        {/* Visual FX Layers */}
        <div className="bg-mesh-grid"></div>
        <div className="bg-glow-blobs">
          <div className="blob-1"></div>
          <div className="blob-2"></div>
          <div className="blob-3"></div>
        </div>
        <BackgroundAnimation />
        <ScrollProgress />

        {/* Floating Navbar */}
        <Navigation />

        {/* Page Content */}
        <main style={{ minHeight: "calc(100vh - 300px)" }}>{children}</main>

        {/* Global Footer */}
        <footer>
          <div className="container">
            <div style={{ marginBottom: "1rem", fontWeight: "700" }}>
              RAJAT<span style={{ color: "var(--primary)" }}>.QE</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Senior SDET & Lead QE Engineer • Designing robust automation frameworks that accelerate engineering velocity.
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              © {new Date().getFullYear()} Rajat Kumar Pradhan. Built with Next.js, TypeScript and pure CSS. All tests passed. 🟢
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}