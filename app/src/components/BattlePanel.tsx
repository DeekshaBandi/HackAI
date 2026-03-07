import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useGameState } from "../hooks/useGameState";
import {
  getProgram,
  txDeclareWar,
  txResolveBattle,
  getBattlePda,
  getNationPda,
} from "../utils/program";

// TODO: import IDL after `anchor build`
// import idl from "../idl/sovereign.json";
const idl: any = null;

const BattlePanel: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  const { connection } = useConnection();
  const {
    myNation,
    nations,
    battles,
    addBattle,
    updateBattle,
    updateNation,
    log,
  } = useGameState();

  const [selectedDefender, setSelectedDefender] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const enemies = nations.filter((n) => n.pda !== myNation?.pda);
  const myActiveBattles = battles.filter(
    (b) => !b.resolved && (b.attackerName === myNation?.name || b.defenderName === myNation?.name)
  );
  const resolvedBattles = battles.filter((b) => b.resolved);

  const handleDeclareWar = async () => {
    if (!myNation) {
      log("You need a nation to declare war.", "warning");
      return;
    }
    if (!selectedDefender) {
      log("Select a nation to attack.", "warning");
      return;
    }
    if (myNation.atWar) {
      log("Your nation is already at war!", "warning");
      return;
    }

    const defenderNation = nations.find((n) => n.pda === selectedDefender);
    if (!defenderNation) return;

    if (!idl) {
      // Demo mode
      setLoading(true);
      log(`⚔️ War declared on ${defenderNation.name} (demo mode)!`, "info");
      setTimeout(() => {
        const fakeBattlePda = `battle_${Date.now()}`;
        addBattle({
          pda: fakeBattlePda,
          attackerName: myNation.name,
          defenderName: defenderNation.name,
          attackerPower: myNation.militaryPower,
          defenderPower: defenderNation.militaryPower,
          resolved: false,
        });
        updateNation(myNation.pda, { atWar: true });
        updateNation(defenderNation.pda, { atWar: true });
        log(
          `Battle opened: ${myNation.name} (${myNation.militaryPower}) vs ${defenderNation.name} (${defenderNation.militaryPower})`,
          "success"
        );
        setLoading(false);
      }, 800);
      return;
    }

    setLoading(true);
    try {
      const program = getProgram(connection, wallet, idl);
      const sig = await txDeclareWar(program, new PublicKey(selectedDefender));
      const [attackerPda] = getNationPda(publicKey!);
      const [battlePda] = getBattlePda(attackerPda, new PublicKey(selectedDefender));
      addBattle({
        pda: battlePda.toBase58(),
        attackerName: myNation.name,
        defenderName: defenderNation.name,
        attackerPower: myNation.militaryPower,
        defenderPower: defenderNation.militaryPower,
        resolved: false,
      });
      updateNation(myNation.pda, { atWar: true });
      updateNation(defenderNation.pda, { atWar: true });
      log(`War declared on ${defenderNation.name}!`, "success", sig);
    } catch (err: any) {
      log(`Declare war failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveBattle = async (battle: (typeof battles)[0]) => {
    if (!idl) {
      // Demo mode
      setLoading(true);
      log("Resolving battle (demo mode)...", "info");
      setTimeout(() => {
        const attackerWins = battle.attackerPower >= battle.defenderPower;
        const winner = attackerWins ? battle.attackerName : battle.defenderName;
        updateBattle(battle.pda, {
          resolved: true,
          winnerName: winner,
        });
        const attackerNation = nations.find((n) => n.name === battle.attackerName);
        const defenderNation = nations.find((n) => n.name === battle.defenderName);
        if (attackerNation)
          updateNation(attackerNation.pda, {
            atWar: false,
            militaryPower: attackerWins
              ? attackerNation.militaryPower + 25
              : Math.max(0, attackerNation.militaryPower - 40),
          });
        if (defenderNation)
          updateNation(defenderNation.pda, {
            atWar: false,
            militaryPower: !attackerWins
              ? defenderNation.militaryPower + 25
              : Math.max(0, defenderNation.militaryPower - 40),
          });
        log(`🏆 Battle resolved! ${winner} wins!`, "success");
        setLoading(false);
      }, 800);
      return;
    }

    setLoading(true);
    try {
      const program = getProgram(connection, wallet, idl);
      const attackerNation = nations.find((n) => n.name === battle.attackerName);
      const defenderNation = nations.find((n) => n.name === battle.defenderName);
      if (!attackerNation || !defenderNation) return;

      const sig = await txResolveBattle(
        program,
        new PublicKey(attackerNation.pda),
        new PublicKey(defenderNation.pda)
      );
      const attackerWins = battle.attackerPower >= battle.defenderPower;
      updateBattle(battle.pda, {
        resolved: true,
        winnerName: attackerWins ? battle.attackerName : battle.defenderName,
      });
      log(`Battle resolved! ${attackerWins ? battle.attackerName : battle.defenderName} wins!`, "success", sig);
    } catch (err: any) {
      log(`Resolve failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="panel">
        <h2>Battle</h2>
        <p className="muted">Connect wallet to access battle controls.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>⚔️ Battle</h2>

      {/* Sealevel parallelism callout */}
      <div className="info-banner">
        <span>⚡</span>
        <span>
          Each battle uses a unique account pair — simultaneous battles execute
          in <strong>parallel on Sealevel</strong>
        </span>
      </div>

      {/* Declare war */}
      {myNation && !myNation.atWar && (
        <div className="card">
          <h3>Declare War</h3>
          {enemies.length === 0 ? (
            <p className="muted">No other nations to attack yet.</p>
          ) : (
            <>
              <div className="form-group">
                <label>Target Nation</label>
                <select
                  className="input"
                  value={selectedDefender}
                  onChange={(e) => setSelectedDefender(e.target.value)}
                >
                  <option value="">— Select enemy —</option>
                  {enemies.map((n) => (
                    <option key={n.pda} value={n.pda}>
                      {n.name} (⚔ {n.militaryPower})
                      {n.atWar ? " [AT WAR]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDefender && (() => {
                const defender = nations.find((n) => n.pda === selectedDefender);
                if (!defender) return null;
                const youWin = (myNation?.militaryPower ?? 0) >= defender.militaryPower;
                return (
                  <div className={`battle-preview ${youWin ? "win" : "lose"}`}>
                    <div className="battle-side">
                      <strong>{myNation?.name}</strong>
                      <span>⚔ {myNation?.militaryPower}</span>
                    </div>
                    <span className="vs">VS</span>
                    <div className="battle-side">
                      <strong>{defender.name}</strong>
                      <span>⚔ {defender.militaryPower}</span>
                    </div>
                    <div className="battle-verdict">
                      {youWin ? "✅ You are predicted to win" : "⚠️ You may lose"}
                    </div>
                  </div>
                );
              })()}

              <button
                className="btn btn-danger"
                onClick={handleDeclareWar}
                disabled={loading || !selectedDefender}
              >
                {loading ? "Signing..." : "⚔️ Declare War"}
              </button>
            </>
          )}
        </div>
      )}

      {myNation?.atWar && (
        <div className="card warning-card">
          <p>⚔️ Your nation is currently at war!</p>
        </div>
      )}

      {/* Active battles */}
      {myActiveBattles.length > 0 && (
        <div className="card">
          <h3>Active Battles</h3>
          {myActiveBattles.map((b) => (
            <div key={b.pda} className="battle-card active">
              <div className="battle-row">
                <span>{b.attackerName}</span>
                <span className="vs-small">⚔️</span>
                <span>{b.defenderName}</span>
              </div>
              <div className="battle-powers">
                <span>{b.attackerPower}</span>
                <span>vs</span>
                <span>{b.defenderPower}</span>
              </div>
              <div className="pda-info">
                <span className="pda-label">Battle PDA (Sealevel-parallel)</span>
                <span className="mono small">{b.pda.slice(0, 20)}...</span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => handleResolveBattle(b)}
                disabled={loading}
              >
                {loading ? "Resolving..." : "Resolve Battle"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Battle history */}
      {resolvedBattles.length > 0 && (
        <div className="card">
          <h3>Battle History</h3>
          {resolvedBattles.map((b) => (
            <div key={b.pda} className="battle-card resolved">
              <div className="battle-row">
                <span>{b.attackerName}</span>
                <span className="vs-small">vs</span>
                <span>{b.defenderName}</span>
              </div>
              <div className="battle-winner">
                🏆 {b.winnerName} won
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BattlePanel;
