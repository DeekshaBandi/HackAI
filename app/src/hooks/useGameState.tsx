import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { PublicKey } from "@solana/web3.js";

export interface NationData {
  pda: string;
  authority: string;
  name: string;
  symbol: string;
  color: string;
  mint: string;
  militaryPower: number;
  territoryCount: number;
  atWar: boolean;
}

export interface TerritoryData {
  q: number;
  r: number;
  ownerPda: string;
  ownerColor: string;
  ownerName: string;
  militaryPower: number;
}

export interface BattleData {
  pda: string;
  attackerName: string;
  defenderName: string;
  attackerPower: number;
  defenderPower: number;
  resolved: boolean;
  winnerName?: string;
}

export interface LogEntry {
  id: number;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
  txSig?: string;
}

interface GameStateContextType {
  nations: NationData[];
  territories: Map<string, TerritoryData>;
  battles: BattleData[];
  logs: LogEntry[];
  myNation: NationData | null;
  gameInitialized: boolean;

  setGameInitialized: (v: boolean) => void;
  addNation: (n: NationData) => void;
  addTerritory: (t: TerritoryData) => void;
  addBattle: (b: BattleData) => void;
  updateBattle: (pda: string, updates: Partial<BattleData>) => void;
  updateNation: (pda: string, updates: Partial<NationData>) => void;
  setMyNation: (n: NationData | null) => void;
  log: (message: string, type?: LogEntry["type"], txSig?: string) => void;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

let logCounter = 0;

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [nations, setNations] = useState<NationData[]>([]);
  const [territories, setTerritories] = useState<Map<string, TerritoryData>>(
    new Map()
  );
  const [battles, setBattles] = useState<BattleData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [myNation, setMyNation] = useState<NationData | null>(null);
  const [gameInitialized, setGameInitialized] = useState(false);

  const addNation = useCallback((n: NationData) => {
    setNations((prev) => [...prev.filter((x) => x.pda !== n.pda), n]);
  }, []);

  const addTerritory = useCallback((t: TerritoryData) => {
    setTerritories((prev) => {
      const next = new Map(prev);
      next.set(`${t.q},${t.r}`, t);
      return next;
    });
  }, []);

  const addBattle = useCallback((b: BattleData) => {
    setBattles((prev) => [...prev.filter((x) => x.pda !== b.pda), b]);
  }, []);

  const updateBattle = useCallback(
    (pda: string, updates: Partial<BattleData>) => {
      setBattles((prev) =>
        prev.map((b) => (b.pda === pda ? { ...b, ...updates } : b))
      );
    },
    []
  );

  const updateNation = useCallback(
    (pda: string, updates: Partial<NationData>) => {
      setNations((prev) =>
        prev.map((n) => (n.pda === pda ? { ...n, ...updates } : n))
      );
      setMyNation((prev) =>
        prev?.pda === pda ? { ...prev, ...updates } : prev
      );
    },
    []
  );

  const log = useCallback(
    (message: string, type: LogEntry["type"] = "info", txSig?: string) => {
      const entry: LogEntry = {
        id: ++logCounter,
        timestamp: new Date(),
        message,
        type,
        txSig,
      };
      setLogs((prev) => [entry, ...prev].slice(0, 50)); // keep last 50
    },
    []
  );

  return (
    <GameStateContext.Provider
      value={{
        nations,
        territories,
        battles,
        logs,
        myNation,
        gameInitialized,
        setGameInitialized,
        addNation,
        addTerritory,
        addBattle,
        updateBattle,
        updateNation,
        setMyNation,
        log,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export function useGameState(): GameStateContextType {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error("useGameState must be used within GameStateProvider");
  return ctx;
}
