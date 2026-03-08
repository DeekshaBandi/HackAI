"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BountyStatus = "Open" | "Submitted" | "Completed";

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: string;
  status: BountyStatus;
  deadline: string;
}

// ─── Bounty data ──────────────────────────────────────────────────────────────

const BOUNTIES: Bounty[] = [
  {
    id: "1",
    title: "Fix login bug in React app",
    description:
      "Users are getting stuck on the OAuth callback screen. Need a clean fix that handles edge-case redirects.",
    reward: "2 SOL",
    status: "Open",
    deadline: "Due in 3 days",
  },
  {
    id: "2",
    title: "Integrate Solana Pay into checkout",
    description:
      "Add SOL and USDC payment options to an existing Next.js storefront using the Solana Pay SDK.",
    reward: "3 SOL",
    status: "Open",
    deadline: "Due in 5 days",
  },
  {
    id: "3",
    title: "Build a CSV export feature",
    description:
      "Let dashboard users export their analytics data as a downloadable CSV file with custom date ranges.",
    reward: "75 USDC",
    status: "Open",
    deadline: "Due in 7 days",
  },
  {
    id: "4",
    title: "Build Discord bot for bounty notifications",
    description:
      "Create a Discord bot that posts new bounty announcements to a channel with formatted embeds and claim links.",
    reward: "1 SOL",
    status: "Open",
    deadline: "Due in 10 days",
  },
  {
    id: "5",
    title: "Write API documentation",
    description:
      "Document all REST endpoints for the project backend using OpenAPI 3.0 spec with request/response examples.",
    reward: "30 USDC",
    status: "Open",
    deadline: "Due in 6 days",
  },
  {
    id: "6",
    title: "Write unit tests for payment module",
    description:
      "Cover the checkout flow with Jest tests — at least 80% coverage on the new Stripe integration.",
    reward: "50 USDC",
    status: "Submitted",
    deadline: "Due in 1 day",
  },
  {
    id: "7",
    title: "Smart contract security review",
    description:
      "Audit a 400-line Anchor program for reentrancy, overflow, and authority-check vulnerabilities.",
    reward: "5 SOL",
    status: "Submitted",
    deadline: "Due in 2 days",
  },
  {
    id: "8",
    title: "Design landing page mockup",
    description:
      "High-fidelity Figma mockup for the new marketing landing page, mobile-first with dark mode variants.",
    reward: "1.5 SOL",
    status: "Completed",
    deadline: "Ended",
  },
];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BountyStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  Open: { label: "Open", bg: "#16a34a1a", color: "#16a34a", border: "#16a34a55" },
  Submitted: { label: "Submitted", bg: "#ca8a041a", color: "#ca8a04", border: "#ca8a0455" },
  Completed: { label: "Completed", bg: "#6b72801a", color: "#9ca3af", border: "#6b728055" },
};

const FILTER_TABS = ["All", "Open", "Submitted", "Completed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

// ─── BountyCard ───────────────────────────────────────────────────────────────

function BountyCard({ bounty }: { bounty: Bounty }) {
  const s = STATUS_CONFIG[bounty.status];
  return (
    <div className="mp-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.78rem",
          color: "#64748b",
        }}
      >
        <span>&#x1F550;</span>
        {bounty.deadline}
      </div>

      <div style={{ height: 1, background: "#2a2d3a" }} />

      <button className="mp-btn-claim">Claim Bounty</button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [search, setSearch] = useState("");

  const filtered = BOUNTIES.filter((b) => {
    const matchesStatus = activeFilter === "All" || b.status === activeFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q || b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const countFor = (tab: FilterTab) =>
    tab === "All" ? BOUNTIES.length : BOUNTIES.filter((b) => b.status === tab).length;

  const totalSol = BOUNTIES.filter((b) => b.status === "Open" && b.reward.includes("SOL"))
    .reduce((sum, b) => sum + parseFloat(b.reward), 0)
    .toFixed(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.9rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #9945ff, #14f195)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "0.35rem",
              lineHeight: 1.2,
            }}
          >
            Blink Bounties
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
            {BOUNTIES.filter((b) => b.status === "Open").length} open bounties &middot;{" "}
            {totalSol} SOL available
          </p>
        </div>
        <Link
          href="/create"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "#fff",
            padding: "0.65rem 1.5rem",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: "0.9rem",
            whiteSpace: "nowrap",
            alignSelf: "center",
          }}
        >
          + Post a Bounty
        </Link>
      </div>

      {/* ── Filter + Search bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            className={`mp-filter-tab${activeFilter === tab ? " active" : ""}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
            <span
              style={{
                marginLeft: "0.35rem",
                background: activeFilter === tab ? "#3d2a6e" : "#1e2130",
                color: activeFilter === tab ? "#c4b5fd" : "#64748b",
                borderRadius: 999,
                padding: "0 0.45rem",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {countFor(tab)}
            </span>
          </button>
        ))}

        <input
          type="text"
          placeholder="Search bounties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            marginLeft: "auto",
            background: "#1a1d27",
            border: "1px solid #2a2d3a",
            borderRadius: 999,
            padding: "0.45rem 1rem",
            color: "#e8eaed",
            fontSize: "0.82rem",
            outline: "none",
            width: 200,
          }}
        />
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "#64748b",
            fontSize: "0.95rem",
          }}
        >
          No bounties match your search.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.1rem",
          }}
        >
          {filtered.map((b) => (
            <BountyCard key={b.id} bounty={b} />
          ))}
        </div>
      )}
    </div>
  );
}
