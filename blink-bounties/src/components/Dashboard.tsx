"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  BountyAccount,
  fetchCreatorBounties,
  lamportsToSol,
  formatDeadline,
} from "@/utils/program";

const STATUS_COLORS: Record<string, string> = {
  Open: "var(--green)",
  Submitted: "var(--yellow)",
  Completed: "#888",
  Cancelled: "var(--red)",
};

function BountyCard({ bounty }: { bounty: BountyAccount }) {
  const blinkUrl = `/api/bounty/${bounty.publicKey.toBase58()}`;
  const detailUrl = `/bounty/${bounty.publicKey.toBase58()}`;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            background: STATUS_COLORS[bounty.status] + "22",
            color: STATUS_COLORS[bounty.status],
            border: `1px solid ${STATUS_COLORS[bounty.status]}`,
            borderRadius: 6,
            padding: "0.2rem 0.6rem",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          {bounty.status}
        </span>
        <span
          style={{ fontWeight: 700, color: "var(--green)", fontSize: "1.1rem" }}
        >
          {lamportsToSol(bounty.amount)} SOL
        </span>
      </div>

      <p
        style={{
          fontWeight: 500,
          lineHeight: 1.4,
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
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          display: "flex",
          gap: "1rem",
        }}
      >
        <span>Deadline: {formatDeadline(bounty.deadline)}</span>
        <span>#{Number(bounty.bountyIndex)}</span>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
        <Link
          href={detailUrl}
          style={{
            flex: 1,
            background: "var(--accent)",
            color: "#fff",
            borderRadius: 8,
            padding: "0.5rem",
            textAlign: "center",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          View Details
        </Link>
        {bounty.status === "Open" && (
          <button
            onClick={() =>
              navigator.clipboard.writeText(
                `${window.location.origin}${blinkUrl}`
              )
            }
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              borderRadius: 8,
              padding: "0.5rem 0.75rem",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Copy Blink
          </button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [bounties, setBounties] = useState<BountyAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    fetchCreatorBounties(connection, publicKey)
      .then(setBounties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [publicKey, connection]);

  if (!connected) {
    return (
      <div style={{ textAlign: "center", paddingTop: "3rem" }}>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Connect your wallet to view your bounties.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  const open = bounties.filter((b) => b.status === "Open");
  const submitted = bounties.filter((b) => b.status === "Submitted");
  const closed = bounties.filter(
    (b) => b.status === "Completed" || b.status === "Cancelled"
  );

  return (
    <div>
      {/* Stats bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          { label: "Total Bounties", value: bounties.length },
          { label: "Open", value: open.length, color: "var(--green)" },
          { label: "Under Review", value: submitted.length, color: "var(--yellow)" },
          { label: "Completed", value: closed.length, color: "var(--text-muted)" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                color: s.color ?? "var(--text)",
              }}
            >
              {loading ? "…" : s.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading your bounties…</p>
      ) : bounties.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: "2rem" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            You have not created any bounties yet.
          </p>
          <Link
            href="/create"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "var(--radius)",
              padding: "0.75rem 2rem",
              fontWeight: 600,
            }}
          >
            Create Your First Bounty
          </Link>
        </div>
      ) : (
        <>
          {[
            { title: "Open", items: open },
            { title: "Under Review", items: submitted },
            { title: "Closed", items: closed },
          ]
            .filter((section) => section.items.length > 0)
            .map((section) => (
              <div key={section.title} style={{ marginBottom: "2rem" }}>
                <h2
                  style={{
                    marginBottom: "1rem",
                    fontSize: "1rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {section.title} ({section.items.length})
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {section.items.map((b) => (
                    <BountyCard key={b.publicKey.toBase58()} bounty={b} />
                  ))}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
