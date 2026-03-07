import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { fetchBounty, buildSubmitWorkIx } from "@/utils/program";
import { RPC_ENDPOINT, PROGRAM_ID } from "@/utils/constants";

// Resolve OPTIONS preflight for Blinks CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: ACTIONS_CORS_HEADERS });
}

// ─── GET /api/bounty/[id] ─────────────────────────────────────────────────────
// Returns Blink metadata card. The [id] is the base58 bounty PDA address.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bountyPDA = new PublicKey(params.id);
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const bounty = await fetchBounty(connection, bountyPDA);

    if (!bounty) {
      return NextResponse.json(
        { error: "Bounty not found" },
        { status: 404, headers: ACTIONS_CORS_HEADERS }
      );
    }

    if (bounty.status !== "Open") {
      const statusLabel = bounty.status === "Submitted" ? "Under Review" : bounty.status;
      const payload: ActionGetResponse = {
        title: `Bounty: ${bounty.description.slice(0, 60)}`,
        icon: `${req.nextUrl.origin}/bounty-icon.png`,
        description: `This bounty is currently ${statusLabel}. Reward: ${
          Number(bounty.amount) / 1e9
        } SOL`,
        label: statusLabel,
        disabled: true,
      };
      return NextResponse.json(payload, { headers: ACTIONS_CORS_HEADERS });
    }

    const deadlineDate = new Date(Number(bounty.deadline) * 1000).toLocaleDateString();
    const amountSol = (Number(bounty.amount) / 1e9).toFixed(4);

    const payload: ActionGetResponse = {
      title: `💰 Bounty: ${bounty.description.slice(0, 60)}`,
      icon: `${req.nextUrl.origin}/bounty-icon.png`,
      description: [
        `Reward: ${amountSol} SOL`,
        `Deadline: ${deadlineDate}`,
        `Creator: ${bounty.creator.toBase58().slice(0, 8)}...`,
        bounty.description.length > 60
          ? `\n${bounty.description}`
          : "",
      ]
        .filter(Boolean)
        .join(" | "),
      label: "Submit Work",
      links: {
        actions: [
          {
            label: "Submit Work",
            href: `/api/bounty/${params.id}?workUrl={workUrl}`,
            parameters: [
              {
                name: "workUrl",
                label: "Your work URL (GitHub PR, Google Drive, Loom, etc.)",
                required: true,
              },
            ],
          },
        ],
      },
    };

    return NextResponse.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (err) {
    console.error("[GET /api/bounty/:id]", err);
    return NextResponse.json(
      { error: "Invalid bounty ID" },
      { status: 400, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

// ─── POST /api/bounty/[id] ────────────────────────────────────────────────────
// Constructs and returns an unsigned `submit_work` transaction.
// Body: { account: string }  (claimant's wallet)
// Query param: workUrl
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bountyPDA = new PublicKey(params.id);
    const workUrl = req.nextUrl.searchParams.get("workUrl") ?? "";

    if (!workUrl) {
      return NextResponse.json(
        { error: "workUrl query param is required" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    if (workUrl.length > 200) {
      return NextResponse.json(
        { error: "workUrl exceeds 200 characters" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const body: ActionPostRequest = await req.json();
    const claimant = new PublicKey(body.account);

    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const bounty = await fetchBounty(connection, bountyPDA);

    if (!bounty) {
      return NextResponse.json(
        { error: "Bounty not found" },
        { status: 404, headers: ACTIONS_CORS_HEADERS }
      );
    }

    if (bounty.status !== "Open") {
      return NextResponse.json(
        { error: "Bounty is not open for submissions" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    if (claimant.equals(bounty.creator)) {
      return NextResponse.json(
        { error: "Creator cannot claim their own bounty" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec > Number(bounty.deadline)) {
      return NextResponse.json(
        { error: "This bounty has expired" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    // Build the submit_work transaction
    const ix = buildSubmitWorkIx(bountyPDA, claimant, workUrl);
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const tx = new Transaction({
      feePayer: claimant,
      blockhash,
      lastValidBlockHeight,
    }).add(ix);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction: tx,
        message: `Work submitted for bounty! Reward: ${
          Number(bounty.amount) / 1e9
        } SOL pending creator approval.`,
      },
    });

    return NextResponse.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (err) {
    console.error("[POST /api/bounty/:id]", err);
    return NextResponse.json(
      { error: "Failed to build transaction" },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}
