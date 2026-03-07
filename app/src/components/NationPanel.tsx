import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useGameState } from "../hooks/useGameState";
import {
  getGamePda,
  getNationPda,
  getMintPda,
  getProgram,
  txInitializeGame,
  txCreateNation,
} from "../utils/program";

// TODO: import IDL after `anchor build`
// import idl from "../idl/sovereign.json";
const idl: any = null;

const PRESET_COLORS = [
  "#E63946", "#457B9D", "#2A9D8F", "#E9C46A",
  "#F4A261", "#8338EC", "#06D6A0", "#FFB703",
];

const NationPanel: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  const { connection } = useConnection();
  const {
    myNation,
    nations,
    gameInitialized,
    setGameInitialized,
    addNation,
    setMyNation,
    log,
  } = useGameState();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleInitGame = async () => {
    if (!idl) {
      // Demo mode
      setGameInitialized(true);
      log("Game world initialized (demo mode).", "success");
      return;
    }
    setLoading(true);
    try {
      const program = getProgram(connection, wallet, idl);
      const sig = await txInitializeGame(program);
      setGameInitialized(true);
      log("Game world initialized!", "success", sig);
    } catch (err: any) {
      log(`Init failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFoundNation = async () => {
    if (!name.trim() || !symbol.trim()) {
      log("Enter a nation name and token symbol.", "warning");
      return;
    }
    if (symbol.length > 8) {
      log("Token symbol must be 8 characters or less.", "warning");
      return;
    }

    if (!idl) {
      // Demo mode — simulate nation creation locally
      setLoading(true);
      log(`Founding nation "${name}" (demo mode)...`, "info");
      setTimeout(() => {
        const fakePda = `demo_${publicKey?.toBase58().slice(0, 8)}`;
        const nation = {
          pda: fakePda,
          authority: publicKey?.toBase58() ?? "",
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          color,
          mint: `demo_mint_${symbol.toLowerCase()}`,
          militaryPower: 100,
          territoryCount: 0,
          atWar: false,
        };
        addNation(nation);
        setMyNation(nation);
        log(
          `Nation "${name}" founded! Token ${symbol.toUpperCase()} minted.`,
          "success"
        );
        setLoading(false);
      }, 1000);
      return;
    }

    setLoading(true);
    try {
      const program = getProgram(connection, wallet, idl);
      const sig = await txCreateNation(program, name.trim(), symbol.trim().toUpperCase(), color);
      const [nationPda] = getNationPda(publicKey!);
      const [mintPda] = getMintPda(nationPda);
      const nation = {
        pda: nationPda.toBase58(),
        authority: publicKey!.toBase58(),
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        color,
        mint: mintPda.toBase58(),
        militaryPower: 100,
        territoryCount: 0,
        atWar: false,
      };
      addNation(nation);
      setMyNation(nation);
      log(`Nation "${name}" founded! Token: ${mintPda.toBase58().slice(0, 12)}...`, "success", sig);
    } catch (err: any) {
      log(`Failed to found nation: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="panel">
        <h2>Nation</h2>
        <p className="muted">Connect your wallet to found a nation.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>🏳 Nation</h2>

      {/* Game init — only needed once per deployment */}
      {!gameInitialized && (
        <div className="card warning-card">
          <p>The game world needs to be initialized first.</p>
          <button className="btn btn-secondary" onClick={handleInitGame} disabled={loading}>
            {loading ? "Initializing..." : "Initialize World"}
          </button>
        </div>
      )}

      {myNation ? (
        /* My nation stats */
        <div className="nation-card" style={{ borderColor: myNation.color }}>
          <div className="nation-header">
            <span className="nation-flag" style={{ backgroundColor: myNation.color }} />
            <div>
              <h3>{myNation.name}</h3>
              <span className="token-badge">${myNation.symbol}</span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">Military Power</span>
              <span className="stat-value">⚔ {myNation.militaryPower}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Territories</span>
              <span className="stat-value">📍 {myNation.territoryCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Status</span>
              <span className={`stat-value ${myNation.atWar ? "at-war" : "at-peace"}`}>
                {myNation.atWar ? "⚔ At War" : "☮ At Peace"}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Mint</span>
              <span className="stat-value mono small">
                {myNation.mint.slice(0, 12)}...
              </span>
            </div>
          </div>

          <div className="pda-info">
            <span className="pda-label">Nation PDA</span>
            <a
              className="pda-link"
              href={`https://explorer.solana.com/address/${myNation.pda}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
            >
              {myNation.pda.slice(0, 20)}... ↗
            </a>
          </div>
        </div>
      ) : (
        /* Found a nation form */
        <div className="card">
          <h3>Found Your Nation</h3>

          <div className="form-group">
            <label>Nation Name</label>
            <input
              className="input"
              placeholder="e.g. Iron Republic"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              disabled={!gameInitialized || loading}
            />
          </div>

          <div className="form-group">
            <label>Token Symbol</label>
            <input
              className="input"
              placeholder="e.g. IRON"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              maxLength={8}
              disabled={!gameInitialized || loading}
            />
            <span className="hint">Your national SPL token ticker</span>
          </div>

          <div className="form-group">
            <label>Nation Color</label>
            <div className="color-grid">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-swatch ${color === c ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleFoundNation}
            disabled={!gameInitialized || loading || !name || !symbol}
          >
            {loading ? "Signing tx..." : "⚡ Found Nation"}
          </button>
        </div>
      )}

      {/* All nations on the map */}
      {nations.length > 0 && (
        <div className="card">
          <h3>All Nations ({nations.length})</h3>
          <div className="nation-list">
            {nations.map((n) => (
              <div key={n.pda} className="nation-list-item">
                <span className="nation-dot" style={{ backgroundColor: n.color }} />
                <span className="nation-list-name">{n.name}</span>
                <span className="nation-list-symbol">${n.symbol}</span>
                <span className="nation-list-power">⚔ {n.militaryPower}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NationPanel;
