import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { PROGRAM_ID } from "./constants";

// ─── PDA Derivation ──────────────────────────────────────────────────────────

export function getBountyStatePDA(creator: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bounty_state"), creator.toBuffer()],
    PROGRAM_ID
  );
}

export function getBountyPDA(
  creator: PublicKey,
  index: bigint
): [PublicKey, number] {
  const indexBuf = Buffer.alloc(8);
  indexBuf.writeBigUInt64LE(index);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bounty"), creator.toBuffer(), indexBuf],
    PROGRAM_ID
  );
}

// ─── Bounty Account Decoder ──────────────────────────────────────────────────

export type BountyStatusKind = "Open" | "Submitted" | "Completed" | "Cancelled";

export interface BountyAccount {
  creator: PublicKey;
  claimant: PublicKey;
  amount: bigint;
  status: BountyStatusKind;
  workUrl: string;
  description: string;
  deadline: bigint;
  bountyIndex: bigint;
  bump: number;
  publicKey: PublicKey;
}

// Anchor discriminator = sha256("account:Bounty")[0..8]
const BOUNTY_DISCRIMINATOR = Buffer.from([
  0x61, 0x2d, 0x7e, 0x67, 0x05, 0x4c, 0x8b, 0x56,
]);

function decodeStatus(byte: number): BountyStatusKind {
  switch (byte) {
    case 0:
      return "Open";
    case 1:
      return "Submitted";
    case 2:
      return "Completed";
    case 3:
      return "Cancelled";
    default:
      return "Open";
  }
}

export function decodeBountyAccount(
  data: Buffer,
  pubkey: PublicKey
): BountyAccount | null {
  try {
    // Skip 8-byte discriminator
    let offset = 8;

    const creator = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const claimant = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const amount = data.readBigUInt64LE(offset);
    offset += 8;

    const statusByte = data[offset];
    const status = decodeStatus(statusByte);
    offset += 1;

    // work_url: 4-byte length prefix + bytes
    const workUrlLen = data.readUInt32LE(offset);
    offset += 4;
    const workUrl = data.slice(offset, offset + workUrlLen).toString("utf8");
    offset += workUrlLen;

    // description: 4-byte length prefix + bytes
    const descLen = data.readUInt32LE(offset);
    offset += 4;
    const description = data.slice(offset, offset + descLen).toString("utf8");
    offset += descLen;

    const deadline = data.readBigInt64LE(offset);
    offset += 8;

    const bountyIndex = data.readBigUInt64LE(offset);
    offset += 8;

    const bump = data[offset];

    return {
      creator,
      claimant,
      amount,
      status,
      workUrl,
      description,
      deadline,
      bountyIndex,
      bump,
      publicKey: pubkey,
    };
  } catch {
    return null;
  }
}

// ─── Fetch Bounty ─────────────────────────────────────────────────────────────

export async function fetchBounty(
  connection: Connection,
  bountyPubkey: PublicKey
): Promise<BountyAccount | null> {
  const info = await connection.getAccountInfo(bountyPubkey);
  if (!info || info.data.length < 8) return null;
  return decodeBountyAccount(Buffer.from(info.data), bountyPubkey);
}

// ─── Fetch All Bounties for a Creator ─────────────────────────────────────────

export async function fetchCreatorBounties(
  connection: Connection,
  creator: PublicKey
): Promise<BountyAccount[]> {
  const [statePDA] = getBountyStatePDA(creator);
  const stateInfo = await connection.getAccountInfo(statePDA);
  if (!stateInfo || stateInfo.data.length < 17) return [];

  // bounty_count is at offset 8 + 32 (discriminator + creator pubkey)
  const count = stateInfo.data.readBigUInt64LE(40);
  const bounties: BountyAccount[] = [];

  for (let i = 0n; i < count; i++) {
    const [pda] = getBountyPDA(creator, i);
    const bounty = await fetchBounty(connection, pda);
    if (bounty) bounties.push(bounty);
  }

  return bounties;
}

// ─── Transaction Builders ─────────────────────────────────────────────────────

/**
 * Build the `create_bounty` instruction data buffer.
 * Instruction discriminator for "create_bounty" = sha256("global:create_bounty")[0..8]
 */
export function buildCreateBountyIx(
  creator: PublicKey,
  bountyIndex: bigint,
  amount: bigint,
  description: string,
  deadline: bigint,
  bountyStatePDA: PublicKey,
  bountyPDA: PublicKey
): anchor.web3.TransactionInstruction {
  // Anchor instruction discriminator: first 8 bytes of sha256("global:create_bounty")
  // Computed offline: [34, 133, 114, 51, 70, 28, 52, 47]
  const discriminator = Buffer.from([34, 133, 114, 51, 70, 28, 52, 47]);

  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(amount);

  const descBytes = Buffer.from(description, "utf8");
  const descLenBuf = Buffer.alloc(4);
  descLenBuf.writeUInt32LE(descBytes.length);

  const deadlineBuf = Buffer.alloc(8);
  deadlineBuf.writeBigInt64LE(deadline);

  const data = Buffer.concat([
    discriminator,
    amountBuf,
    descLenBuf,
    descBytes,
    deadlineBuf,
  ]);

  return new anchor.web3.TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: bountyStatePDA, isSigner: false, isWritable: true },
      { pubkey: bountyPDA, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
      {
        pubkey: anchor.web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
  });
}

/**
 * Build the `submit_work` instruction data buffer.
 * Discriminator for "submit_work" = [154, 186, 98, 212, 75, 98, 0, 197]
 */
export function buildSubmitWorkIx(
  bountyPDA: PublicKey,
  claimant: PublicKey,
  workUrl: string
): anchor.web3.TransactionInstruction {
  const discriminator = Buffer.from([154, 186, 98, 212, 75, 98, 0, 197]);

  const urlBytes = Buffer.from(workUrl, "utf8");
  const urlLenBuf = Buffer.alloc(4);
  urlLenBuf.writeUInt32LE(urlBytes.length);

  const data = Buffer.concat([discriminator, urlLenBuf, urlBytes]);

  return new anchor.web3.TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: bountyPDA, isSigner: false, isWritable: true },
      { pubkey: claimant, isSigner: true, isWritable: false },
    ],
    data,
  });
}

/**
 * Build the `approve_submission` instruction.
 * Discriminator: [104, 120, 98, 202, 164, 47, 5, 65]
 */
export function buildApproveSubmissionIx(
  bountyPDA: PublicKey,
  creator: PublicKey,
  claimant: PublicKey
): anchor.web3.TransactionInstruction {
  const discriminator = Buffer.from([104, 120, 98, 202, 164, 47, 5, 65]);

  return new anchor.web3.TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: bountyPDA, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: claimant, isSigner: false, isWritable: true },
      {
        pubkey: anchor.web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data: discriminator,
  });
}

/**
 * Build the `cancel_bounty` instruction.
 * Discriminator: [196, 4, 102, 29, 113, 68, 61, 117]
 */
export function buildCancelBountyIx(
  bountyPDA: PublicKey,
  creator: PublicKey
): anchor.web3.TransactionInstruction {
  const discriminator = Buffer.from([196, 4, 102, 29, 113, 68, 61, 117]);

  return new anchor.web3.TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: bountyPDA, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
      {
        pubkey: anchor.web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data: discriminator,
  });
}

export function lamportsToSol(lamports: bigint | number): string {
  return (Number(lamports) / LAMPORTS_PER_SOL).toFixed(4);
}

export function formatDeadline(unixTs: bigint | number): string {
  return new Date(Number(unixTs) * 1000).toLocaleString();
}
