"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  BountyAccount,
  fetchBounty,
  buildSubmitWorkIx,
  buildApproveSubmissionIx,
  buildCancelBountyIx,
  lamportsToSol,
  formatDeadline,
} from "@/utils/program";

const STATUS_COLORS: Record<string, string> = {
  Open: "var(--green)",
  Submitted: "var(--yellow)",
  Completed: "#888",
  Cancelled: "var(--red)",
};

export default function BountyDetail({ bountyId }: { bountyId: string }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [bounty, setBounty] = useState<BountyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [workUrl, setWorkUrl] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [txMsg, setTxMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const pda = new PublicKey(bountyId);
      const b = await fetchBounty(connection, pda);
      setBounty(b);
    } catch {
      setError("Invalid bounty ID or account not found.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [bountyId, connection]);

  // Live subscription to account changes
  useEffect(() => {
    let subId: number | null = null;
    try {
      const pda = new PublicKey(bountyId);
      subId = connection.onAccountChange(pda, (info) => {
        const { decodeBountyAccount } = require("@/utils/program");
        const updated = decodeBountyAccount(Buffer.from(info.data), pda);
        if (updated) setBounty(updated);
      });
    } catch {}
    return () => {
      if (subId !== null) connection.removeAccountChangeListener(subId);
    };
  }, [bountyId, connection]);

  async function handleSubmitWork(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey || !bounty) return;
    setTxStatus("loading");
    try {
      const ix = buildSubmitWorkIx(bounty.publicKey, publicKey, workUrl);
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
      setTxMsg("Work submitted! Waiting for creator approval.");
      setTxStatus("done");
      await load();
    } catch (err: unknown) {
      setTxMsg(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus("error");
    }
  }

  async function handleApprove() {
    if (!publicKey || !bounty) return;
    setTxStatus("loading");
    try {
      const ix = buildApproveSubmissionIx(
        bounty.publicKey,
        publicKey,
        bounty.claimant
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
      setTxMsg(`Approved! ${lamportsToSol(bounty.amount)} SOL sent to claimant.`);
      setTxStatus("done");
      await load();
    } catch (err: unknown) {
      setTxMsg(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus("error");
    }
  }

  async function handleCancel() {
    if (!publicKey || !bounty) return;
    setTxStatus("loading");
    try {
      const ix = buildCancelBountyIx(bounty.publicKey, publicKey);
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
      setTxMsg("Bounty cancelled. Funds refunded.");
      setTxStatus("done");
      await load();
    } catch (err: unknown) {
      setTxMsg(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus("error");
    }
  }

  if (loading) {
    return <p style={{ color: "var(--text-muted)" }}>Loading bounty…</p>;
  }

  if (error || !bounty) {
    return (
      <p style={{ color: "var(--red)" }}>
        {error || "Bounty not found or has been closed."}
      </p>
    );
  }

  const isCreator = publicKey?.equals(bounty.creator);
  const isOpen = bounty.status === "Open";
  const isSubmitted = bounty.status === "Submitted";
  const blinkUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/bounty/${bountyId}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1rem",
          }}
        >
          <span
            style={{
              background: STATUS_COLORS[bounty.status] + "22",
              color: STATUS_COLORS[bounty.status],
              border: `1px solid ${STATUS_COLORS[bounty.status]}`,
              borderRadius: 6,
              padding: "0.25rem 0.75rem",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            {bounty.status}
          </span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--green)",
            }}
          >
            {lamportsToSol(bounty.amount)} SOL
          </span>
        </div>

        <h1 style={{ marginBottom: "0.75rem", lineHeight: 1.4 }}>
          {bounty.description}
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}
        >
          <div>
            <strong>Creator:</strong>{" "}
            {bounty.creator.toBase58().slice(0, 8)}…
            {bounty.creator.toBase58().slice(-4)}
          </div>
          <div>
            <strong>Deadline:</strong> {formatDeadline(bounty.deadline)}
          </div>
          {bounty.claimant && !bounty.claimant.equals(PublicKey.default) && (
            <div>
              <strong>Claimant:</strong>{" "}
              {bounty.claimant.toBase58().slice(0, 8)}…
              {bounty.claimant.toBase58().slice(-4)}
            </div>
          )}
          {bounty.workUrl && (
            <div>
              <strong>Work:</strong>{" "}
              <a
                href={bounty.workUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {bounty.workUrl.slice(0, 40)}…
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Blink URL */}
      {isOpen && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.25rem",
          }}
        >
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            🔗 Shareable Blink URL — paste anywhere
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <code
              style={{
                flex: 1,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "0.5rem 0.75rem",
                fontSize: "0.8rem",
                color: "var(--accent)",
                wordBreak: "break-all",
              }}
            >
              {blinkUrl}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(blinkUrl)}
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.5rem 1rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Feedback message */}
      {txMsg && (
        <div
          style={{
            background: txStatus === "error" ? "#2a0a0a" : "#0a2a1a",
            border: `1px solid ${txStatus === "error" ? "var(--red)" : "var(--green)"}`,
            borderRadius: 8,
            padding: "0.75rem 1rem",
            color: txStatus === "error" ? "var(--red)" : "var(--green)",
            fontSize: "0.875rem",
          }}
        >
          {txMsg}
        </div>
      )}

      {/* Actions */}
      {!connected ? (
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            Connect wallet to interact with this bounty.
          </p>
          <WalletMultiButton />
        </div>
      ) : isOpen && !isCreator ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
          }}
        >
          <h3 style={{ marginBottom: "1rem" }}>Submit Your Work</h3>
          <form
            onSubmit={handleSubmitWork}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <input
              type="url"
              value={workUrl}
              onChange={(e) => setWorkUrl(e.target.value)}
              placeholder="https://github.com/your-repo/pull/123"
              required
              maxLength={200}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                color: "var(--text)",
                fontSize: "1rem",
              }}
            />
            <button
              type="submit"
              disabled={txStatus === "loading"}
              style={{
                background: txStatus === "loading" ? "var(--border)" : "var(--green)",
                color: "#000",
                border: "none",
                borderRadius: "var(--radius)",
                padding: "0.85rem",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: txStatus === "loading" ? "not-allowed" : "pointer",
              }}
            >
              {txStatus === "loading" ? "Submitting…" : "Submit Work"}
            </button>
          </form>
        </div>
      ) : isSubmitted && isCreator ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>Review Submission</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>
            Review the work and approve to release funds, or cancel to reclaim.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={handleApprove}
              disabled={txStatus === "loading"}
              style={{
                flex: 1,
                background: "var(--green)",
                color: "#000",
                border: "none",
                borderRadius: "var(--radius)",
                padding: "0.85rem",
                fontWeight: 700,
                cursor: txStatus === "loading" ? "not-allowed" : "pointer",
              }}
            >
              {txStatus === "loading" ? "Processing…" : "✅ Approve & Pay"}
            </button>
            <button
              onClick={handleCancel}
              disabled={txStatus === "loading"}
              style={{
                flex: 1,
                background: "#2a0a0a",
                color: "var(--red)",
                border: "1px solid var(--red)",
                borderRadius: "var(--radius)",
                padding: "0.85rem",
                fontWeight: 700,
                cursor: txStatus === "loading" ? "not-allowed" : "pointer",
              }}
            >
              Reject & Cancel
            </button>
          </div>
        </div>
      ) : isOpen && isCreator ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>Creator Controls</h3>
          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: "1.25rem",
              fontSize: "0.9rem",
            }}
          >
            No submissions yet. You can cancel and reclaim your funds.
          </p>
          <button
            onClick={handleCancel}
            disabled={txStatus === "loading"}
            style={{
              background: "#2a0a0a",
              color: "var(--red)",
              border: "1px solid var(--red)",
              borderRadius: "var(--radius)",
              padding: "0.75rem 2rem",
              fontWeight: 700,
              cursor: txStatus === "loading" ? "not-allowed" : "pointer",
            }}
          >
            {txStatus === "loading" ? "Cancelling…" : "Cancel Bounty & Refund"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
