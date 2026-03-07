import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

// Replace with your actual program ID after `anchor build && anchor deploy`
export const PROGRAM_ID = new PublicKey(
  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

// ─── PDA Derivations ──────────────────────────────────────────────────────────

export function getGamePda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("game")], PROGRAM_ID);
}

export function getNationPda(founder: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("nation"), founder.toBuffer()],
    PROGRAM_ID
  );
}

export function getMintPda(nationPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), nationPda.toBuffer()],
    PROGRAM_ID
  );
}

export function getTerritoryPda(x: number, y: number): [PublicKey, number] {
  const xBuf = Buffer.alloc(2);
  xBuf.writeInt16LE(x);
  const yBuf = Buffer.alloc(2);
  yBuf.writeInt16LE(y);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("territory"), xBuf, yBuf],
    PROGRAM_ID
  );
}

export function getBattlePda(
  attackerNation: PublicKey,
  defenderNation: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("battle"),
      attackerNation.toBuffer(),
      defenderNation.toBuffer(),
    ],
    PROGRAM_ID
  );
}

// ─── Program Helper ───────────────────────────────────────────────────────────

export function getProgram(
  connection: Connection,
  wallet: WalletContextState,
  idl: Idl
): Program {
  const provider = new AnchorProvider(
    connection,
    wallet as any,
    AnchorProvider.defaultOptions()
  );
  return new Program(idl, PROGRAM_ID, provider);
}

// ─── Instructions ─────────────────────────────────────────────────────────────

export async function txInitializeGame(program: Program): Promise<string> {
  const [gamePda] = getGamePda();
  return program.methods
    .initializeGame()
    .accounts({
      game: gamePda,
      authority: program.provider.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function txCreateNation(
  program: Program,
  name: string,
  symbol: string,
  color: string
): Promise<string> {
  const founder = program.provider.publicKey!;
  const [gamePda] = getGamePda();
  const [nationPda] = getNationPda(founder);
  const [mintPda] = getMintPda(nationPda);
  const treasury = await getAssociatedTokenAddress(mintPda, nationPda, true);

  return program.methods
    .createNation(name, symbol, color)
    .accounts({
      game: gamePda,
      nation: nationPda,
      nationalMint: mintPda,
      nationalTreasury: treasury,
      founder,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}

export async function txClaimTerritory(
  program: Program,
  x: number,
  y: number
): Promise<string> {
  const authority = program.provider.publicKey!;
  const [gamePda] = getGamePda();
  const [nationPda] = getNationPda(authority);
  const [territoryPda] = getTerritoryPda(x, y);

  return program.methods
    .claimTerritory(x, y)
    .accounts({
      game: gamePda,
      nation: nationPda,
      territory: territoryPda,
      authority,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function txDeclareWar(
  program: Program,
  defenderNationPda: PublicKey
): Promise<string> {
  const authority = program.provider.publicKey!;
  const [attackerNationPda] = getNationPda(authority);
  const [battlePda] = getBattlePda(attackerNationPda, defenderNationPda);

  return program.methods
    .declareWar()
    .accounts({
      attacker: attackerNationPda,
      defender: defenderNationPda,
      battle: battlePda,
      authority,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function txResolveBattle(
  program: Program,
  attackerNationPda: PublicKey,
  defenderNationPda: PublicKey
): Promise<string> {
  const authority = program.provider.publicKey!;
  const [battlePda] = getBattlePda(attackerNationPda, defenderNationPda);

  return program.methods
    .resolveBattle()
    .accounts({
      attacker: attackerNationPda,
      defender: defenderNationPda,
      battle: battlePda,
      authority,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
