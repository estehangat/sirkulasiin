import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — SirkulasiIn",
  description: "Dashboard SirkulasiIn - Kelola aktivitas sirkular Anda.",
};

export default function DashboardPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "var(--font-plus-jakarta), sans-serif",
        background: "var(--color-neutral)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "48px",
          background: "white",
          borderRadius: "24px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          maxWidth: "400px",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            marginBottom: "8px",
            color: "#1A1A1A",
          }}
        >
          Welcome to Dashboard!
        </h1>
        <p style={{ fontSize: "15px", color: "#737369", lineHeight: 1.6 }}>
          Login berhasil. Halaman dashboard akan segera dibangun.
        </p>
      </div>
    </div>
  );
}
