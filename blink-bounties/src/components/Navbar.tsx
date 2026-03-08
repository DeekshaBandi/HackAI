"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Navbar() {
  return (
    <header
      style={{
        padding: "0 32px",
        borderBottom: "1px solid #1a1a2e",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: 64,
        background: "#0a0a0f",
      }}
    >
      {/* Logo */}
      <div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            color: "#fff",
          }}
        >
          &#x26A1; FlashDrop
        </div>
        <div style={{ fontSize: "11px", color: "#555", marginTop: 1 }}>
          Real-time art drops on Solana
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            fontSize: "12px",
            color: "#a855f7",
            background: "#1a0a2e",
            padding: "6px 14px",
            borderRadius: 20,
            border: "1px solid rgba(168,85,247,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="fd-pulse fd-dot" />
          Devnet
        </div>

        <WalletMultiButton />
      </div>
    </header>
  );
}
