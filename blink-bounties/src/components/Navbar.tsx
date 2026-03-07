"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/create", label: "+ Create Bounty" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "var(--accent)",
          }}
        >
          💰 Blink Bounties
        </Link>

        <div style={{ display: "flex", gap: "1.5rem" }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "0.9rem",
                color:
                  pathname === link.href ? "var(--text)" : "var(--text-muted)",
                fontWeight: pathname === link.href ? 600 : 400,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <WalletMultiButton />
    </nav>
  );
}
