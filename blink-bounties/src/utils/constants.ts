import { PublicKey, clusterApiUrl } from "@solana/web3.js";

// The deployed Anchor program ID (matches Anchor.toml)
export const PROGRAM_ID = new PublicKey(
  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl("devnet");

export const CLUSTER = "devnet" as const;

// Minimum lamports a wallet should have to interact (for gas)
export const MIN_SOL_BALANCE = 0.01 * 1e9; // 0.01 SOL
