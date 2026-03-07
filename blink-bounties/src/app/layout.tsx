import type { Metadata } from "next";
import "./globals.css";
import SolanaWalletProvider from "@/components/WalletProvider";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Blink Bounties",
  description:
    "Post and claim on-chain bounties on Solana. Shareable as Blinks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>
          <Navbar />
          <main
            style={{
              maxWidth: 900,
              margin: "0 auto",
              padding: "2rem 1rem",
            }}
          >
            {children}
          </main>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
