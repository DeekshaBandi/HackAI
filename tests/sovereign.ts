import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sovereign } from "../target/types/sovereign";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { assert } from "chai";

describe("sovereign", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sovereign as Program<Sovereign>;

  // Two test wallets simulating two nation founders
  const alice = provider.wallet as anchor.Wallet;
  const bob = anchor.web3.Keypair.generate();

  // PDAs
  let gamePda: PublicKey;
  let aliceNationPda: PublicKey;
  let bobNationPda: PublicKey;
  let aliceMintPda: PublicKey;
  let bobMintPda: PublicKey;
  let battlePda: PublicKey;

  before(async () => {
    // Derive all PDAs upfront
    [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game")],
      program.programId
    );

    [aliceNationPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nation"), alice.publicKey.toBuffer()],
      program.programId
    );

    [bobNationPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nation"), bob.publicKey.toBuffer()],
      program.programId
    );

    [aliceMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), aliceNationPda.toBuffer()],
      program.programId
    );

    [bobMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), bobNationPda.toBuffer()],
      program.programId
    );

    [battlePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("battle"),
        aliceNationPda.toBuffer(),
        bobNationPda.toBuffer(),
      ],
      program.programId
    );

    // Airdrop SOL to bob for tx fees
    const sig = await provider.connection.requestAirdrop(
      bob.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);
  });

  it("Initializes the game world", async () => {
    await program.methods
      .initializeGame()
      .accounts({
        game: gamePda,
        authority: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const game = await program.account.gameState.fetch(gamePda);
    assert.equal(game.nationCount, 0);
    assert.equal(game.territoryCount, 0);
    console.log("✅ Game initialized. PDA:", gamePda.toBase58());
  });

  it("Alice founds her nation with an SPL token", async () => {
    const aliceTreasury = await getAssociatedTokenAddress(
      aliceMintPda,
      aliceNationPda,
      true // allowOwnerOffCurve — nation PDA is off-curve
    );

    await program.methods
      .createNation("Iron Republic", "IRON", "#E63946")
      .accounts({
        game: gamePda,
        nation: aliceNationPda,
        nationalMint: aliceMintPda,
        nationalTreasury: aliceTreasury,
        founder: alice.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const nation = await program.account.nation.fetch(aliceNationPda);
    assert.equal(nation.name, "Iron Republic");
    assert.equal(nation.symbol, "IRON");
    assert.equal(nation.militaryPower.toNumber(), 100);
    assert.equal(nation.atWar, false);

    const game = await program.account.gameState.fetch(gamePda);
    assert.equal(game.nationCount, 1);

    console.log("✅ Nation 'Iron Republic' founded");
    console.log("   Mint:", aliceMintPda.toBase58());
    console.log("   Treasury:", aliceTreasury.toBase58());
  });

  it("Bob founds his nation", async () => {
    const bobProvider = new anchor.AnchorProvider(
      provider.connection,
      new anchor.Wallet(bob),
      {}
    );
    const bobProgram = new Program<Sovereign>(
      program.idl,
      program.programId,
      bobProvider
    );

    const bobTreasury = await getAssociatedTokenAddress(
      bobMintPda,
      bobNationPda,
      true
    );

    await bobProgram.methods
      .createNation("Steel Dominion", "STEEL", "#457B9D")
      .accounts({
        game: gamePda,
        nation: bobNationPda,
        nationalMint: bobMintPda,
        nationalTreasury: bobTreasury,
        founder: bob.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const nation = await program.account.nation.fetch(bobNationPda);
    assert.equal(nation.name, "Steel Dominion");

    const game = await program.account.gameState.fetch(gamePda);
    assert.equal(game.nationCount, 2);

    console.log("✅ Nation 'Steel Dominion' founded");
  });

  it("Alice claims a territory hex (0,0)", async () => {
    const x = 0;
    const y = 0;

    const xBuf = Buffer.alloc(2);
    xBuf.writeInt16LE(x);
    const yBuf = Buffer.alloc(2);
    yBuf.writeInt16LE(y);

    const [territoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("territory"), xBuf, yBuf],
      program.programId
    );

    await program.methods
      .claimTerritory(x, y)
      .accounts({
        game: gamePda,
        nation: aliceNationPda,
        territory: territoryPda,
        authority: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const territory = await program.account.territory.fetch(territoryPda);
    assert.equal(territory.x, 0);
    assert.equal(territory.y, 0);
    assert.ok(territory.owner.equals(aliceNationPda));

    const nation = await program.account.nation.fetch(aliceNationPda);
    assert.equal(nation.territoryCount, 1);
    assert.equal(nation.militaryPower.toNumber(), 110); // 100 + 10 per territory

    console.log("✅ Territory (0,0) claimed. PDA:", territoryPda.toBase58());
  });

  it("Alice declares war on Bob", async () => {
    await program.methods
      .declareWar()
      .accounts({
        attacker: aliceNationPda,
        defender: bobNationPda,
        battle: battlePda,
        authority: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const battle = await program.account.battle.fetch(battlePda);
    assert.ok(battle.attacker.equals(aliceNationPda));
    assert.ok(battle.defender.equals(bobNationPda));
    assert.equal(battle.resolved, false);
    assert.equal(battle.attackerPower.toNumber(), 110); // Alice has extra territory power

    const aliceNation = await program.account.nation.fetch(aliceNationPda);
    const bobNation = await program.account.nation.fetch(bobNationPda);
    assert.equal(aliceNation.atWar, true);
    assert.equal(bobNation.atWar, true);

    console.log("✅ War declared! Battle PDA:", battlePda.toBase58());
    console.log(
      "   Alice power:",
      battle.attackerPower.toNumber(),
      "vs Bob power:",
      battle.defenderPower.toNumber()
    );
  });

  it("Battle resolves — higher power wins", async () => {
    await program.methods
      .resolveBattle()
      .accounts({
        attacker: aliceNationPda,
        defender: bobNationPda,
        battle: battlePda,
        authority: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const battle = await program.account.battle.fetch(battlePda);
    assert.equal(battle.resolved, true);
    assert.ok(battle.winner.equals(aliceNationPda)); // Alice had more power

    const aliceNation = await program.account.nation.fetch(aliceNationPda);
    const bobNation = await program.account.nation.fetch(bobNationPda);
    assert.equal(aliceNation.atWar, false);
    assert.equal(bobNation.atWar, false);

    console.log("✅ Battle resolved!");
    console.log("   Winner:", battle.winner.toBase58());
    console.log("   Alice power after:", aliceNation.militaryPower.toNumber());
    console.log("   Bob power after:", bobNation.militaryPower.toNumber());
  });
});
