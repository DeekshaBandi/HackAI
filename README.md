# ⚔️ SOVEREIGN — On-Chain Nation-State Strategy Game

> A real-time multiplayer nation-building strategy game where every nation, territory, battle, and token is a live on-chain account on Solana.

## What's Built

| Feature | Implementation |
|---|---|
| **PDAs** | Nation, Territory, Battle, Game — 4 account types, 30+ instances |
| **SPL Tokens** | Each nation mints its own national currency on creation |
| **CPI** | Nation program CPIs into SPL Token program to mint supply |
| **Sealevel Parallelism** | Battle accounts use unique seed pairs — simultaneous battles run in parallel |
| **PoH Timestamps** | Territory claims and battle starts record slot/timestamp on-chain |
| **Anchor Framework** | Full IDL, account validation, custom errors |
| **React Frontend** | SVG world map, Phantom wallet, real-time state |

## Project Structure

```
sovereign/
├── programs/sovereign/src/lib.rs   # Anchor program (5 instructions)
├── tests/sovereign.ts              # Full test suite
├── app/                            # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── WorldMap.tsx        # SVG hex grid map
│       │   ├── NationPanel.tsx     # Nation creation + stats
│       │   ├── BattlePanel.tsx     # War declaration + resolution
│       │   └── GameLog.tsx         # Live event feed
│       ├── hooks/useGameState.tsx  # Global game state context
│       └── utils/
│           ├── program.ts          # PDA derivations + tx helpers
│           └── hex.ts              # Hex grid math
├── setup.sh                        # Full toolchain installer
└── Anchor.toml
```

## Quick Start

### 1. Install toolchain (first time only)
```bash
chmod +x setup.sh && ./setup.sh
```

### 2. Build & deploy the program
```bash
anchor build
anchor deploy --provider.cluster devnet
```

### 3. Update program ID

After deploy, copy the program ID from the output and update it in three places:

```bash
# Anchor.toml
[programs.devnet]
sovereign = "YOUR_PROGRAM_ID_HERE"

# programs/sovereign/src/lib.rs
declare_id!("YOUR_PROGRAM_ID_HERE");

# app/src/utils/program.ts
export const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");
```

Then rebuild:
```bash
anchor build
```

### 4. Copy IDL to frontend
```bash
cp target/idl/sovereign.json app/src/idl/sovereign.json
```

### 5. Enable IDL in frontend components

In `WorldMap.tsx`, `NationPanel.tsx`, and `BattlePanel.tsx`, uncomment:
```ts
import idl from "../idl/sovereign.json";
const idl: any = null;  // DELETE this line
```

### 6. Run the frontend
```bash
cd app && yarn dev
```

Open http://localhost:5173 and connect Phantom (set wallet to **Devnet**).

### 7. Run tests
```bash
anchor test
```

---

## Demo Flow (5 minutes)

1. **Connect wallet** → fund with devnet SOL (`solana airdrop 2`)
2. **Found a nation** → wallet signs tx → SPL token minted → shows in wallet
3. **Claim territories** → click hexes on the map → PDA created per tile
4. **Declare war** on another wallet's nation → Battle PDA created
5. **Resolve battle** → winner determined by military power
6. **Open Solana Explorer** → navigate PDA tree live → "no backend" moment

---

## Solana Features Used

```
PDAs                   ████████████████████ Nation / Territory / Battle / Game accounts
SPL Tokens             ████████████████████ National currency per nation
CPI                    ████████████████████ MintTo into SPL Token program
Sealevel Parallelism   ████████████████████ Unique account sets per battle pair
PoH Timestamps         ████████████████████ claimed_at / started_slot on-chain
Anchor                 ████████████████████ IDL, account validation, custom errors
Associated Token Accts ████████████████████ Nation treasury ATAs
Rent-exempt accounts   ████████████████████ All accounts funded above rent threshold
```

---

## Architecture Notes

### Why battles are Sealevel-parallel

Each battle PDA uses seeds `["battle", attacker_pubkey, defender_pubkey]`. Two battles between different nation pairs touch completely different accounts — Solana's runtime detects no conflicts and schedules them in parallel. This is demonstrable by submitting two `declare_war` transactions simultaneously and showing the Solana Explorer that they executed in the same slot.

### Why PoH matters for territory claims

The `claim_territory` instruction stores `Clock::get()?.unix_timestamp` and `Clock::get()?.slot`. If two players race to claim the same hex, only the first valid transaction succeeds — the `init` constraint fails if the PDA already exists. The loser can verify on-chain that they were second using the slot number.

### Token economics

Each nation's token is a standard SPL token with the nation PDA as mint authority. This means:
- Tokens are real — tradeable on any DEX that supports SPL tokens
- Only the program (via PDA-signed CPI) can mint new tokens
- Players can hold each other's national currencies as a real economic mechanic
