import React from "react";
import { useGameState } from "../hooks/useGameState";

const GameLog: React.FC = () => {
  const { logs } = useGameState();

  if (logs.length === 0) return null;

  return (
    <div className="card game-log">
      <h3>📜 Event Log</h3>
      <div className="log-entries">
        {logs.map((entry) => (
          <div key={entry.id} className={`log-entry log-${entry.type}`}>
            <span className="log-time">
              {entry.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span className="log-msg">{entry.message}</span>
            {entry.txSig && (
              <a
                className="log-tx"
                href={`https://explorer.solana.com/tx/${entry.txSig}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                title="View on Solana Explorer"
              >
                ↗ tx
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameLog;
