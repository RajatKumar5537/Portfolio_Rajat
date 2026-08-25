import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}