import Navigation from "../../components/Navigation";
import ScrollProgress from "../../components/ScrollProgress";
import BackgroundAnimation from "../../components/BackgroundAnimation";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
    </>
  );
}
