"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Drop {
  id: number;
  title: string;
  creator: string;
  price: string;
  editions: number;
  claimed: number;
  /** seconds remaining; 0 = sold out; -1 = perpetual / no timer */
  secondsLeft: number;
  gradient: [string, string];
  emoji: string;
}

interface MyDrop {
  id: number;
  title: string;
  price: string;
  editions: number;
  claimed: number;
  earned: string;
  gradient: [string, string];
  emoji: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_DROPS: Drop[] = [
  {
    id: 1,
    title: "Neon Samurai",
    creator: "@darkwave.sol",
    price: "0.5 SOL",
    editions: 10,
    claimed: 7,
    secondsLeft: 272,
    gradient: ["#7c3aed", "#ec4899"],
    emoji: "⚔️",
  },
  {
    id: 2,
    title: "Cyber Lotus",
    creator: "@flora.sol",
    price: "0.2 SOL",
    editions: 5,
    claimed: 2,
    secondsLeft: 730,
    gradient: ["#0891b2", "#3b82f6"],
    emoji: "🌸",
  },
  {
    id: 3,
    title: "Desert Glitch",
    creator: "@sand.sol",
    price: "1.0 SOL",
    editions: 3,
    claimed: 3,
    secondsLeft: 0,
    gradient: ["#ea580c", "#ef4444"],
    emoji: "🏜️",
  },
  {
    id: 4,
    title: "Quantum Ghost",
    creator: "@specter.sol",
    price: "0.75 SOL",
    editions: 8,
    claimed: 1,
    secondsLeft: 1800,
    gradient: ["#7c3aed", "#0891b2"],
    emoji: "👻",
  },
  {
    id: 5,
    title: "Sakura Rain",
    creator: "@blossom.sol",
    price: "0.3 SOL",
    editions: 15,
    claimed: 9,
    secondsLeft: 420,
    gradient: ["#db2777", "#f97316"],
    emoji: "🌸",
  },
  {
    id: 6,
    title: "Solar Punk",
    creator: "@leaf.sol",
    price: "0.4 SOL",
    editions: 6,
    claimed: 0,
    secondsLeft: 3540,
    gradient: ["#16a34a", "#0891b2"],
    emoji: "🌿",
  },
];

const MY_DROPS: MyDrop[] = [
  {
    id: 7,
    title: "Void Protocol",
    price: "0.8 SOL",
    editions: 8,
    claimed: 5,
    earned: "4.0 SOL",
    gradient: ["#059669", "#0891b2"],
    emoji: "🌀",
  },
  {
    id: 8,
    title: "Chrome Angel",
    price: "0.3 SOL",
    editions: 20,
    claimed: 20,
    earned: "6.0 SOL",
    gradient: ["#d97706", "#ea580c"],
    emoji: "👼",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number): string {
  if (s <= 0) return "SOLD";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ─── LiveDropCard ─────────────────────────────────────────────────────────────

function LiveDropCard({ drop }: { drop: Drop }) {
  const soldOut = drop.secondsLeft === 0 || drop.claimed >= drop.editions;
  const pct = (drop.claimed / drop.editions) * 100;
  const timeLabel = soldOut ? "SOLD" : fmtTime(drop.secondsLeft);

  return (
    <div className="fd-card">
      {/* Art preview */}
      <div
        style={{
          height: 180,
          background: `linear-gradient(135deg, ${drop.gradient[0]}, ${drop.gradient[1]})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 64,
          position: "relative",
        }}
      >
        {drop.emoji}

        {/* Timer / sold badge */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(0,0,0,0.65)",
            color: soldOut ? "#ef4444" : "#fff",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {soldOut ? "SOLD OUT" : `⏱ ${timeLabel}`}
        </div>

        {/* Edition counter */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            background: "rgba(0,0,0,0.65)",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
          }}
        >
          {drop.claimed}/{drop.editions} claimed
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              {drop.title}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              {drop.creator}
            </div>
          </div>
          <div style={{ fontWeight: 700, color: "#a855f7", fontSize: 15 }}>
            {drop.price}
          </div>
        </div>

        {/* Edition progress bar */}
        <div
          style={{
            background: "#1a1a2e",
            borderRadius: 4,
            height: 4,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: soldOut
                ? "#ef4444"
                : "linear-gradient(90deg, #a855f7, #ec4899)",
              height: "100%",
              borderRadius: 4,
              transition: "width 0.5s ease",
            }}
          />
        </div>

        <button className="fd-buy-btn" disabled={soldOut}>
          {soldOut ? "Sold Out" : `Buy Now — ${drop.price}`}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: 10,
            fontSize: 11,
            color: "#444",
          }}
        >
          &#x1F517; Share Blink → paste anywhere on X
        </div>
      </div>
    </div>
  );
}

// ─── MyDropCard ───────────────────────────────────────────────────────────────

function MyDropCard({ drop }: { drop: MyDrop }) {
  const soldOut = drop.claimed >= drop.editions;

  return (
    <div className="fd-card">
      {/* Art preview */}
      <div
        style={{
          height: 160,
          background: `linear-gradient(135deg, ${drop.gradient[0]}, ${drop.gradient[1]})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 56,
          position: "relative",
        }}
      >
        {drop.emoji}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: soldOut
              ? "rgba(239,68,68,0.12)"
              : "rgba(168,85,247,0.12)",
            color: soldOut ? "#ef4444" : "#a855f7",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            border: `1px solid ${soldOut ? "rgba(239,68,68,0.25)" : "rgba(168,85,247,0.25)"}`,
          }}
        >
          {soldOut ? "SOLD OUT" : "LIVE"}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 16,
            marginBottom: 4,
          }}
        >
          {drop.title}
        </div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>
          {drop.claimed} of {drop.editions} editions sold
        </div>

        <div
          style={{
            background: "#1a1a2e",
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "#666" }}>Earned</div>
            <div style={{ fontWeight: 700, color: "#4ade80", fontSize: 16 }}>
              {drop.earned}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#666" }}>Price / edition</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{drop.price}</div>
          </div>
        </div>

        <button className="fd-copy-btn">Copy Blink Link &#x1F517;</button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [tab, setTab] = useState<"live" | "mine">("live");
  const [drops, setDrops] = useState<Drop[]>(INITIAL_DROPS);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick down secondsLeft for live drops
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setDrops((prev) =>
        prev.map((d) =>
          d.secondsLeft > 0 ? { ...d, secondsLeft: d.secondsLeft - 1 } : d
        )
      );
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const liveCount = drops.filter(
    (d) => d.secondsLeft > 0 && d.claimed < d.editions
  ).length;

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "#0a0a0f" }}>
      {/* ── Tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 32,
          padding: "0 32px",
          borderBottom: "1px solid #1a1a2e",
        }}
      >
        <button
          className={`fd-tab${tab === "live" ? " active" : ""}`}
          onClick={() => setTab("live")}
        >
          &#x1F525; Live Drops
          {liveCount > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: "rgba(168,85,247,0.15)",
                color: "#a855f7",
                borderRadius: 999,
                padding: "0 7px",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {liveCount}
            </span>
          )}
        </button>
        <button
          className={`fd-tab${tab === "mine" ? " active" : ""}`}
          onClick={() => setTab("mine")}
        >
          &#x1F3A8; My Drops
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px" }}>
        {tab === "live" && (
          <>
            {/* Section header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  Live Right Now
                </div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                  Click any drop to claim — before it&apos;s gone
                </div>
              </div>
              <button className="fd-outline-btn">+ Post a Drop</button>
            </div>

            {/* Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 20,
              }}
            >
              {drops.map((d) => (
                <LiveDropCard key={d.id} drop={d} />
              ))}
            </div>
          </>
        )}

        {tab === "mine" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                My Drops
              </div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                Your published artwork and earnings
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 20,
              }}
            >
              {MY_DROPS.map((d) => (
                <MyDropCard key={d.id} drop={d} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
