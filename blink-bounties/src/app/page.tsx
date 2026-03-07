import Link from "next/link";

export default function Home() {
  return (
    <div style={{ textAlign: "center", paddingTop: "4rem" }}>
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: 800,
          marginBottom: "1rem",
          background: "linear-gradient(135deg, #9945ff, #14f195)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Blink Bounties
      </h1>

      <p
        style={{
          fontSize: "1.2rem",
          color: "var(--text-muted)",
          maxWidth: 560,
          margin: "0 auto 2.5rem",
          lineHeight: 1.6,
        }}
      >
        Post on-chain bounties on Solana. Share them as{" "}
        <strong style={{ color: "var(--text)" }}>Blinks</strong> — paste the
        URL in GitHub, Discord, X, or anywhere. Anyone can claim and submit
        work directly from the link.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
        <Link
          href="/create"
          style={{
            background: "var(--accent)",
            color: "#fff",
            padding: "0.8rem 2rem",
            borderRadius: "var(--radius)",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Post a Bounty
        </Link>

        <Link
          href="/dashboard"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "0.8rem 2rem",
            borderRadius: "var(--radius)",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          View My Bounties
        </Link>
      </div>

      <div
        style={{
          marginTop: "4rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5rem",
          textAlign: "left",
        }}
      >
        {[
          {
            icon: "🔒",
            title: "Trustless Escrow",
            desc: "SOL is locked on-chain the moment you post. No middleman.",
          },
          {
            icon: "🔗",
            title: "Shareable Blinks",
            desc: "Every bounty gets a URL you can paste anywhere—GitHub, Discord, X.",
          },
          {
            icon: "⚡",
            title: "Instant Payout",
            desc: "One click to approve. Funds go straight to the claimant.",
          },
          {
            icon: "🛡️",
            title: "Creator Control",
            desc: "Only you can approve or cancel. Refund anytime if no one claimed.",
          },
        ].map((f) => (
          <div
            key={f.title}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.5rem",
            }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
              {f.icon}
            </div>
            <h3 style={{ marginBottom: "0.4rem" }}>{f.title}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
