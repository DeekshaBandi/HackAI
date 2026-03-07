#!/bin/bash
# SOVEREIGN — Toolchain Setup Script
# Run this first: chmod +x setup.sh && ./setup.sh

set -e

echo "⚔️  SOVEREIGN — Setting up Solana development toolchain"
echo "=================================================="

# ── 1. Rust ────────────────────────────────────────────────────────────────────
if ! command -v rustup &>/dev/null; then
  echo "📦 Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  echo "✅ Rust already installed: $(rustc --version)"
fi

# Ensure correct toolchain
rustup update stable
rustup component add rustfmt clippy

# ── 2. Solana CLI ──────────────────────────────────────────────────────────────
if ! command -v solana &>/dev/null; then
  echo "📦 Installing Solana CLI..."
  sh -c "$(curl -sSfL https://release.solana.com/v1.18.18/install)"
  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
  echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> "$HOME/.bashrc"
else
  echo "✅ Solana CLI: $(solana --version)"
fi

# ── 3. Anchor CLI ──────────────────────────────────────────────────────────────
if ! command -v anchor &>/dev/null; then
  echo "📦 Installing Anchor CLI..."
  cargo install --git https://github.com/coral-xyz/anchor avm --locked
  avm install 0.30.1
  avm use 0.30.1
else
  echo "✅ Anchor: $(anchor --version)"
fi

# ── 4. Node / Yarn ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "📦 Installing Node.js via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install --lts
  nvm use --lts
else
  echo "✅ Node: $(node --version)"
fi

if ! command -v yarn &>/dev/null; then
  npm install -g yarn
fi

# ── 5. Generate Solana keypair ─────────────────────────────────────────────────
if [ ! -f "$HOME/.config/solana/id.json" ]; then
  echo "🔑 Generating Solana keypair..."
  solana-keygen new --no-bip39-passphrase
fi

# ── 6. Configure for devnet ────────────────────────────────────────────────────
solana config set --url devnet
echo "🌐 Configured for devnet"

# ── 7. Request devnet airdrop ──────────────────────────────────────────────────
echo "💰 Requesting devnet SOL airdrop..."
solana airdrop 2 || echo "⚠️  Airdrop may have rate-limited — try: solana airdrop 1"

# ── 8. Install dependencies ────────────────────────────────────────────────────
echo "📦 Installing root dependencies..."
yarn install

echo "📦 Installing app dependencies..."
cd app && yarn install && cd ..

echo ""
echo "=================================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. anchor build                   # Compile the Solana program"
echo "  2. anchor deploy                  # Deploy to devnet"
echo "  3. Copy the program ID from deploy output into:"
echo "     - Anchor.toml (programs.devnet.sovereign)"
echo "     - app/src/utils/program.ts (PROGRAM_ID)"
echo "     - programs/sovereign/src/lib.rs (declare_id!)"
echo "  4. Copy target/idl/sovereign.json → app/src/idl/sovereign.json"
echo "  5. Uncomment the IDL import in WorldMap.tsx, NationPanel.tsx, BattlePanel.tsx"
echo "  6. cd app && yarn dev             # Start the frontend"
echo ""
echo "🗺  Open http://localhost:5173 in your browser"
echo "⚔️  Connect Phantom wallet (set to Devnet in wallet settings)"
