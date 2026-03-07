import React, { useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import Navbar from "./components/Navbar";
import WorldMap from "./components/WorldMap";
import NationPanel from "./components/NationPanel";
import BattlePanel from "./components/BattlePanel";
import GameLog from "./components/GameLog";
import { GameStateProvider } from "./hooks/useGameState";

export type ActivePanel = "nation" | "battle" | "map";

const App: React.FC = () => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [network]
  );

  const [activePanel, setActivePanel] = useState<ActivePanel>("map");

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <GameStateProvider>
            <div className="app">
              <Navbar activePanel={activePanel} setActivePanel={setActivePanel} />
              <div className="main-layout">
                <div className="map-container">
                  <WorldMap />
                </div>
                <div className="sidebar">
                  {activePanel === "nation" && <NationPanel />}
                  {activePanel === "battle" && <BattlePanel />}
                  {activePanel === "map" && (
                    <div className="map-info">
                      <h2>World Map</h2>
                      <p>Click a hex to claim territory for your nation.</p>
                      <p>
                        Switch to <strong>Nation</strong> to found your nation
                        first, then claim tiles on the map.
                      </p>
                    </div>
                  )}
                  <GameLog />
                </div>
              </div>
            </div>
          </GameStateProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
