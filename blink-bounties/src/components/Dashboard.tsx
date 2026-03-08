"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

type BountyStatus = "Open" | "Submitted" | "Completed";

interface SampleBounty {
  id: string;
  title: string;
  description: string;
  reward: string;
  status: BountyStatus;
  deadline: string;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const MY_BOUNTIES: SampleBounty[] = [
  {
    id: "my-1",
    title: "Fix login bug in React app",
    description:
      "Users are getting stuck on the OAuth callback screen. Need a clean fix that handles edge-case redirects.",
    reward: "2 SOL",
    status: "Open",
    deadline: "Due in 3 days",
  },
  {
    id: "my-2",
    title: "Write unit tests for payment module",
    description:
      "Cover the checkout flow with Jest tests — at least 80% coverage on the new Stripe integration.",
    reward: "50 USDC",
    status: "Submitted",
    deadline: "Due in 1 day",
  },
  {
    id: "my-3",
    title: "Design landing page mockup",
    description:
      "High-fidelity Figma mockup for the new marketing landing page, mobile-first with dark mode variants.",
    reward: "1.5 SOL",
    status: "Completed",
    deadline: "Ended",
  },
];

const AVAILABLE_BOUNTIES: SampleBounty[] = [
  {
    id: "av-1",
    title: "Integrate Solana Pay into checkout",
    description:
      "Add SOL and USDC payment options to an existing Next.js storefront using the Solana Pay SDK.",
    reward: "3 SOL",
    status: "Open",
    deadline: "Due in 5 days",
  },
  {
    id: "av-2",
    title: "Build a CSV export feature",
    description:
      "Let dashboard users export their analytics data as a downloadable CSV file with custom date ranges.",
    reward: "75 USDC",
    status: "Open",
    deadline: "Due in 7 days",
  },
  {
    id: "av-3",
    title: "Smart contract security review",
    description:
      "Audit a 400-line Anchor program for reentrancy, overflow, and authority-check vulnerabilities.",
    reward: "5 SOL",
    status: "Submitted",
    deadline: "Due in 2 days",
  },
];

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BountyStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  Open: {
    label: "Open",
    bg: "#16a34a1a",
    color: "#16a34a",
    border: "#16a34a55",
  },
  Submitted: {
    label: "Submitted",
    bg: "#ca8a041a",
    color: "#ca8a04",
    border: "#ca8a0455",
  },
  Completed: {
    label: "Completed",
    bg: "#6b72801a",
    color: "#9ca3af",
    border: "#6b728055",
  },
};

// ─── BountyCard ───────────────────────────────────────────────────────────────

function BountyCard({
  bounty,
  variant,
}: {
  bounty: SampleBounty;
  variant: "posted" | "available";
}) {
  const s = STATUS_CONFIG[bounty.status];

  return (
    <div
      style={{
        background: "#1a1a2e",
        border: "1px solid #2a2a3e",
        borderRadius: 16,
        padding: "1.25rem 1.4rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 8px 32px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 24px rgba(0,0,0,0.35)";
      }}
    >
      {/* Top row: status badge + reward */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            background: s.bg,
            color: s.color,
            border: `1px solid ${s.border}`,
            borderRadius: 999,
            padding: "0.2rem 0.75rem",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {s.label}
        </span>

        <span
          style={{
            fontWeight: 800,
            fontSize: "1.05rem",
            color: "#a78bfa",
            letterSpacing: "-0.01em",
          }}
        >
          {bounty.reward}
        </span>
      </div>

      {/* Title */}
      <p
        style={{
          fontWeight: 700,
          fontSize: "1rem",
          lineHeight: 1.35,
          color: "#f1f5f9",
          margin: 0,
        }}
      >
        {bounty.title}
      </p>

      {/* Description */}
      <p
        style={{
          fontSize: "0.85rem",
          color: "#94a3b8",
          lineHeight: 1.55,
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {bounty.description}
      </p>

      {/* Deadline */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.78rem",
          color: "#64748b",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>🕐</span>
        {bounty.deadline}
      </div>

      {/* Divider */}
      <div
        style={{ height: 1, background: "#2a2a3e", margin: "0 -0.1rem" }}
      />

      {/* Action button */}
      <button
        style={{
          width: "100%",
          padding: "0.6rem 1rem",
          borderRadius: 10,
          fontWeight: 700,
          fontSize: "0.875rem",
          cursor: "pointer",
          border: "none",
          transition: "opacity 0.15s",
          ...(variant === "available"
            ? {
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff",
              }
            : {
                background: "#16213e",
                color: "#a78bfa",
                border: "1px solid #312e81",
              }),
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
        }
      >
        {variant === "available" ? "Claim Bounty" : "View Submission"}
      </button>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  accent,
}: {
  title: string;
  count: number;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "1.25rem",
      }}
    >
      <div
        style={{
          width: 4,
          height: 22,
          borderRadius: 4,
          background: accent,
          flexShrink: 0,
        }}
      />
      <h2
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#e2e8f0",
          margin: 0,
        }}
      >
        {title}
      </h2>
      <span
        style={{
          background: "#1e293b",
          color: "#64748b",
          borderRadius: 999,
          padding: "0.1rem 0.6rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          border: "1px solid #2a2a3e",
        }}
      >
        {count}
      </span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
      {/* My Posted Bounties */}
      <section>
        <SectionHeader
          title="My Posted Bounties"
          count={MY_BOUNTIES.length}
          accent="#7c3aed"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.1rem",
          }}
        >
          {MY_BOUNTIES.map((b) => (
            <BountyCard key={b.id} bounty={b} variant="posted" />
          ))}
        </div>
      </section>

      {/* Available Bounties */}
      <section>
        <SectionHeader
          title="Available Bounties"
          count={AVAILABLE_BOUNTIES.length}
          accent="#4f46e5"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.1rem",
          }}
        >
          {AVAILABLE_BOUNTIES.map((b) => (
            <BountyCard key={b.id} bounty={b} variant="available" />
          ))}
        </div>
      </section>
    </div>
  );
}
