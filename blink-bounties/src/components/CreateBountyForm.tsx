"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getBountyStatePDA,
  getBountyPDA,
  buildCreateBountyIx,
} from "@/utils/program";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "0.75rem 1rem",
  color: "var(--text)",
  fontSize: "1rem",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.4rem",
  color: "var(--text-muted)",
  fontSize: "0.875rem",
  fontWeight: 500,
};

export default function CreateBountyForm() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [description, setDescription] = useState("");
  const [amountSol, setAmountSol] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [blinkUrl, setBlinkUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const amountLamports = BigInt(
        Math.round(parseFloat(amountSol) * LAMPORTS_PER_SOL)
      );
      if (amountLamports <= 0n) throw new Error("Amount must be greater than 0");

      const deadlineTs = BigInt(Math.floor(new Date(deadlineDate).getTime() / 1000));
      if (deadlineTs <= BigInt(Math.floor(Date.now() / 1000))) {
        throw new Error("Deadline must be in the future");
      }

      // Get current bounty index for this creator
      const [bountyStatePDA] = getBountyStatePDA(publicKey);
      const stateInfo = await connection.getAccountInfo(bountyStatePDA);
      let currentIndex = 0n;
      if (stateInfo && stateInfo.data.length >= 48) {
        currentIndex = stateInfo.data.readBigUInt64LE(40);
      }

      const [bountyPDA] = getBountyPDA(publicKey, currentIndex);

      const ix = buildCreateBountyIx(
        publicKey,
        currentIndex,
        amountLamports,
        description,
        deadlineTs,
        bountyStatePDA,
        bountyPDA
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const tx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(ix);

      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      const url = `${window.location.origin}/api/bounty/${bountyPDA.toBase58()}`;
      setBlinkUrl(url);
      setStatus("success");
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Transaction failed");
      setStatus("error");
    }
  }

  if (!connected) {
    return (
      <div style={{ textAlign: "center", paddingTop: "3rem" }}>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Connect your wallet to create a bounty.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--green)",
          borderRadius: "var(--radius)",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎉</div>
        <h2 style={{ marginBottom: "0.5rem" }}>Bounty Created!</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Share your Blink URL anywhere — GitHub, Discord, X, or paste it into
          any Blinks-compatible wallet.
        </p>

        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            wordBreak: "break-all",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
            textAlign: "left",
            color: "var(--accent)",
          }}
        >
          {blinkUrl}
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            onClick={() => navigator.clipboard.writeText(blinkUrl)}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
            }}
          >
            Copy Blink URL
          </button>
          <button
            onClick={() => {
              setStatus("idle");
              setDescription("");
              setAmountSol("");
              setDeadlineDate("");
              setBlinkUrl("");
            }}
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
            }}
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <label style={labelStyle}>Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the task clearly. What needs to be delivered?"
          rows={4}
          maxLength={256}
          required
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <small style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          {description.length}/256
        </small>
      </div>

      <div>
        <label style={labelStyle}>Reward Amount (SOL) *</label>
        <input
          type="number"
          step="0.001"
          min="0.001"
          value={amountSol}
          onChange={(e) => setAmountSol(e.target.value)}
          placeholder="e.g. 0.5"
          required
          style={inputStyle}
        />
        <small style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          This amount will be locked in escrow on-chain.
        </small>
      </div>

      <div>
        <label style={labelStyle}>Deadline *</label>
        <input
          type="datetime-local"
          value={deadlineDate}
          onChange={(e) => setDeadlineDate(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      {status === "error" && (
        <div
          style={{
            background: "#2a0a0a",
            border: "1px solid var(--red)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            color: "var(--red)",
            fontSize: "0.875rem",
          }}
        >
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          background: status === "loading" ? "var(--border)" : "var(--accent)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius)",
          padding: "0.9rem",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: status === "loading" ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        {status === "loading" ? "Creating Bounty…" : "Create Bounty & Lock Funds"}
      </button>

      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
        Funds are locked in a Solana PDA. Only you can approve or cancel.
      </p>
    </form>
  );
}
