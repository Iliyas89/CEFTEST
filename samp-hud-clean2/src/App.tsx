import { useState, useEffect } from 'react';
import HUD from './components/HUD/HUD';
import Speedometer from './components/Speedometer/Speedometer';
import Inventory from './components/Inventory/Inventory';
import Pause from './components/Pause/Pause';

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

interface SpeedoData {
  speed: number;
  fuel: number;
  mileage: number;
  hp: number;
  turnLeft: boolean;
  lights: boolean;
  engine: boolean;
  parking: boolean;
  locked: boolean;
  turnRight: boolean;
}

declare global {
  interface Window {
    toggleHud?: (status: boolean) => void;
    toggleSpeedometer?: (status: boolean) => void;
    toggleInventory?: (status: boolean) => void;
    togglePause?: (status: boolean) => void;
    updateHUD?: (dataJson: string | object) => void;
    updateSpeedometer?: (dataJson: string | object) => void;
    cef?: any;
  }
}

export default function App() {
  const [showHud, setShowHud] = useState<boolean>(false);
  const [showSpeedometer, setShowSpeedometer] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [showPause, setShowPause] = useState<boolean>(false);

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

  const [speedoData, setSpeedoData] = useState<SpeedoData>({
    speed: 0,
    fuel: 100,
    mileage: 0,
    hp: 100,
    turnLeft: false,
    lights: false,
    engine: false,
    parking: false,
    locked: false,
    turnRight: false
  });

  const parseCefStatus = (rawVal: any): boolean => {
    const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
    if (typeof val === 'boolean') return val;
    return val === 1 || val === "1" || val === "true";
  };

  useEffect(() => {
    window.toggleHud = (status: boolean) => setShowHud(status);
    window.toggleSpeedometer = (status: boolean) => setShowSpeedometer(status);
    window.toggleInventory = (status: boolean) => setShowInventory(status);
    window.togglePause = (status: boolean) => setShowPause(status);

    const processHudData = (dataJsonString: string | object) => {
      try {
        const parsedData: HudData = typeof dataJsonString === 'string' 
          ? JSON.parse(dataJsonString) 
          : dataJsonString;
        setHudData(prev => ({ ...prev, ...parsedData }));
      } catch (error) {
        console.error("Ошибка парсинга JSON в updateHUD:", error);
      }
    };

    const processSpeedoData = (dataJsonString: string | object) => {
      try {
        const parsedData: Partial<SpeedoData> = typeof dataJsonString === 'string' 
          ? JSON.parse(dataJsonString) 
          : dataJsonString;
        setSpeedoData(prev => ({ ...prev, ...parsedData }));
      } catch (error) {
        console.error("Ошибка парсинга JSON в updateSpeedometer:", error);
      }
    };

    window.updateHUD = processHudData;
    window.updateSpeedometer = processSpeedoData;

    let checkCefInterval = setInterval(() => {
      if (window.cef) {
        console.log("[App] Плагин CEF обнаружен!");
        
        window.cef.on('toggleHud', (val: any) => setShowHud(parseCefStatus(val)));
        window.cef.on('toggleSpeedometer', (val: any) => setShowSpeedometer(parseCefStatus(val)));
        window.cef.on('toggleInventory', (val: any) => setShowInventory(parseCefStatus(val)));
        
        // --- ИСПРАВЛЕНО: переключение паузы (без аргументов) ---
        window.cef.on('togglePause', () => {
          setShowPause(prev => !prev);
        });

        window.cef.on('updateHUD', (rawData: any) => {
          const data = Array.isArray(rawData) ? rawData[0] : rawData;
          if (data) processHudData(data);
        });

        window.cef.on('updateSpeedometer', (rawData: any) => {
          const data = Array.isArray(rawData) ? rawData[0] : rawData;
          if (data) processSpeedoData(data);
        });

        const onPlayerStats = (hp: number, _max: number, arm: number, _b: number, _w: number, _wp: number, _am: number, _ma: number, money: number) => {
          setHudData(prev => ({ ...prev, health: Math.round(hp), armor: Math.round(arm), money: money }));
        };

        window.cef.on('game:data:playerStats', onPlayerStats);
        window.cef.emit('game:data:pollPlayerStats', true, 50);
        window.cef.emit("OnCefInterfaceReady");
        
        clearInterval(checkCefInterval);
      }
    }, 100);

    return () => {
      clearInterval(checkCefInterval);
      if (window.cef) {
        window.cef.off('toggleHud');
        window.cef.off('toggleSpeedometer');
        window.cef.off('toggleInventory');
        window.cef.off('togglePause');
        window.cef.off('updateHUD');
        window.cef.off('updateSpeedometer');
        window.cef.off('game:data:playerStats');
      }
    };
  }, []);

  const isInteractiveOpen = showInventory || showPause;

  return (
    <div style={{ 
      width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', 
      margin: 0, padding: 0, pointerEvents: isInteractiveOpen ? 'auto' : 'none' 
    }}>
      
      {showHud && !showPause && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          <HUD {...hudData} />
        </div>
      )}

      {showSpeedometer && !showPause && (
        <div style={{ position: 'absolute', bottom: '50px', right: '50px', pointerEvents: 'none', zIndex: 2 }}>
          <Speedometer {...speedoData} />
        </div>
      )}

      {showInventory && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 500, pointerEvents: 'auto' }}>
          <Inventory />
        </div>
      )}

      {showPause && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'auto' }}>
          <Pause />
        </div>
      )}
    </div>
  );
}