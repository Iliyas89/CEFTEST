import { useState, useEffect } from 'react';
import HUD from './components/HUD/HUD';
import Speedometer from './components/Speedometer/Speedometer';
import Inventory from './components/Inventory/Inventory';

interface HudData {
  health?: number;
  armor?: number;
  hunger?: number;
  money?: number;
  playerId?: number;
  serverIndex?: number;
  serverName?: string;
  online?: number;
}

declare global {
  interface Window {
    toggleHud?: (status: boolean) => void;
    toggleSpeedometer?: (status: boolean) => void;
    toggleInventory?: (status: boolean) => void;
    updateHUD?: (dataJson: string | object) => void;
    updateLocalStats?: (localHp: number, localArmor: number) => void;
  }
}

export default function App() {
  const [showHud, setShowHud] = useState<boolean>(true);
  const [showSpeedometer, setShowSpeedometer] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);

  const [hudData, setHudData] = useState<HudData>({
    health: 100,
    armor: 0,
    hunger: 100,
    money: 0,
    playerId: 0,
    serverIndex: 1,
    serverName: "AVALON",
    online: 1
  });

  useEffect(() => {
    window.toggleHud = (status: boolean) => { setShowHud(status); };
    window.toggleSpeedometer = (status: boolean) => { setShowSpeedometer(status); };
    window.toggleInventory = (status: boolean) => { setShowInventory(status); };

    // Единая функция обновления из Павно (Серверная часть)
    window.updateHUD = (dataJsonString: string | object) => {
      try {
        const parsedData: HudData = typeof dataJsonString === 'string' 
          ? JSON.parse(dataJsonString) 
          : dataJsonString;
        
        setHudData(prev => ({
          ...prev,
          ...parsedData
        }));
      } catch (error) {
        console.error("Ошибка парсинга JSON в updateHUD:", error);
      }
    };

    // Клиентское обновление ХП/Брони напрямую от плагина игры (Высокая частота)
    window.updateLocalStats = (localHp: number, localArmor: number) => {
      setHudData(prev => ({
        ...prev,
        health: localHp !== undefined ? Math.round(localHp) : prev.health,
        armor: localArmor !== undefined ? Math.round(localArmor) : prev.armor
      }));
    };

    // --- УМНЫЙ СИМУЛЯТОР ДЛЯ БРАУЗЕРА ---
    // Если открыто просто в Google Chrome, а не в игре — запустим легкую симуляцию траты сытости
    const isRunningInGame = (window as any).cef !== undefined || (window as any).mp !== undefined;
    let localInterval: any = null;

    if (!isRunningInGame) {
      console.log("[App] Запущен симулятор в обычном браузере.");
      localInterval = setInterval(() => {
        setHudData(prev => ({
          ...prev,
          hunger: Math.max(10, (prev.hunger ?? 100) - 1) // Просто плавно снижаем голод для теста визуала
        }));
      }, 5000);
    } else {
      // Если мы в игре, и плагин поддерживает чтение ХП через внутренний Chromium
      if ((window as any).cef && (window as any).cef.getHp) {
        localInterval = setInterval(() => {
          const hp = (window as any).cef.getHp();
          const arm = (window as any).cef.getArmour();
          if (window.updateLocalStats) window.updateLocalStats(hp, arm);
        }, 200);
      }
    }

    return () => {
      delete window.toggleHud;
      delete window.toggleSpeedometer;
      delete window.toggleInventory;
      delete window.updateHUD;
      delete window.updateLocalStats;
      if (localInterval) clearInterval(localInterval);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', margin: 0, padding: 0, pointerEvents: 'none' }}>
      {showHud && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          <HUD 
            health={hudData.health}
            armor={hudData.armor}
            hunger={hudData.hunger}
            money={hudData.money}
            playerId={hudData.playerId}
            serverIndex={hudData.serverIndex}
            serverName={hudData.serverName}
            online={hudData.online}
          />
        </div>
      )}

      {showSpeedometer && (
        <div style={{ position: 'absolute', bottom: '50px', right: '50px', pointerEvents: 'none', zIndex: 2 }}>
          <Speedometer />
        </div>
      )}

      {showInventory && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'auto' }}>
          <Inventory />
        </div>
      )}
    </div>
  );
}