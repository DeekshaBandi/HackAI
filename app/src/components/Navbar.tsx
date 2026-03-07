import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGameState } from "../hooks/useGameState";
import { ActivePanel } from "../App";

interface NavbarProps {
  activePanel: ActivePanel;
  setActivePanel: (p: ActivePanel) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activePanel, setActivePanel }) => {
  const { connected } = useWallet();
  const { myNation } = useGameState();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="logo">⚔️</span>
        <span className="brand-name">SOVEREIGN</span>
        <span className="brand-sub">On-Chain Nation-State</span>
      </div>

      {connected && (
        <div className="navbar-tabs">
          <button
            className={`tab-btn ${activePanel === "map" ? "active" : ""}`}
            onClick={() => setActivePanel("map")}
          >
            🗺 World Map
          </button>
          <button
            className={`tab-btn ${activePanel === "nation" ? "active" : ""}`}
            onClick={() => setActivePanel("nation")}
          >
            🏳 Nation
            {myNation && (
              <span
                className="nation-badge"
                style={{ backgroundColor: myNation.color }}
              >
                {myNation.symbol}
              </span>
            )}
          </button>
          <button
            className={`tab-btn ${activePanel === "battle" ? "active" : ""}`}
            onClick={() => setActivePanel("battle")}
          >
            ⚔️ Battle
          </button>
        </div>
      )}

      <div className="navbar-wallet">
        {myNation && (
          <div className="nation-indicator">
            <span
              className="nation-dot"
              style={{ backgroundColor: myNation.color }}
            />
            <span>{myNation.name}</span>
          </div>
        )}
        <WalletMultiButton />
      </div>
    </nav>
  );
};

export default Navbar;
