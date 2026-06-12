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
    updateHUD?: (dataJson: string | object) => void;
    updateSpeedometer?: (dataJson: string | object) => void;
    cef?: any;
  }
}

export default function App() {
  const [showHud, setShowHud] = useState<boolean>(false);
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

  useEffect(() => {
    window.toggleHud = (status: boolean) => setShowHud(status);
    window.toggleSpeedometer = (status: boolean) => setShowSpeedometer(status);
    window.toggleInventory = (status: boolean) => setShowInventory(status);

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

    const parseCefStatus = (rawVal: any): boolean => {
      const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
      return val === 1 || val === true || val === "1";
    };

    let checkCefInterval = setInterval(() => {
      if (window.cef) {
        console.log("[App] Плагин CEF успешно обнаружен в процессе игры!");
        
        window.cef.on('toggleHud', (rawVal: any) => {
          setShowHud(parseCefStatus(rawVal));
        });

        window.cef.on('updateHUD', (rawData: any) => {
          const data = Array.isArray(rawData) ? rawData[0] : rawData;
          if (data) processHudData(data);
        });

        window.cef.on('toggleSpeedometer', (rawVal: any) => {
          setShowSpeedometer(parseCefStatus(rawVal));
        });

        window.cef.on('updateSpeedometer', (rawData: any) => {
          const data = Array.isArray(rawData) ? rawData[0] : rawData;
          if (data) processSpeedoData(data);
        });

        window.cef.on('toggleInventory', (rawVal: any) => {
          setShowInventory(parseCefStatus(rawVal));
        });

        const onPlayerStats = (hp: number, _max_hp: number, arm: number, _breath: number, _wanted: number, _weapon: number, _ammo: number, _max_ammo: number, money: number, _speed: number) => {
          setHudData(prev => ({
            ...prev,
            health: Math.round(hp),
            armor: Math.round(arm),
            money: money,
          }));
        };

        window.cef.on('game:data:playerStats', onPlayerStats);
        window.cef.emit('game:data:pollPlayerStats', true, 50);
        
        window.cef.emit("OnCefInterfaceReady");
        
        clearInterval(checkCefInterval);
      }
    }, 100);

    // === СИМУЛЯТОР ДЛЯ ТЕСТА В БРАУЗЕРЕ ===
    let simInterval: any = null;
    let iconCounter = 0;
    const isBrowserTesting = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isBrowserTesting && !window.cef) {
      console.log("[App] Включена симуляция HUD и спидометра в браузере.");
      setShowHud(true);
      setShowSpeedometer(true); // Автоматически показываем спидометр в Хроме для теста

      simInterval = setInterval(() => {
        setHudData(prev => ({ ...prev, hunger: Math.max(10, (prev.hunger ?? 100) - 1) }));
        
        setSpeedoData(prev => ({
          speed: Math.floor(Math.random() * 40) + 80,
          fuel: prev.fuel > 10 ? prev.fuel - 1 : 100,
          mileage: prev.mileage + 1,
          hp: Math.floor(Math.random() * 6) + 95,
          turnLeft: iconCounter === 0,
          lights: iconCounter === 1,
          engine: iconCounter === 2,
          parking: iconCounter === 3,
          locked: iconCounter === 4,
          turnRight: iconCounter === 5,
        }));

        iconCounter = (iconCounter + 1) % 6;
      }, 2000);
    }

    return () => {
      clearInterval(checkCefInterval);
      if (simInterval) clearInterval(simInterval);
      
      if (window.cef) {
        try {
          window.cef.off('toggleHud');
          window.cef.off('updateHUD');
          window.cef.off('toggleSpeedometer');
          window.cef.off('updateSpeedometer');
          window.cef.off('toggleInventory');
          window.cef.off('game:data:playerStats');
        } catch(e) {
          console.log("Ошибка при очистке событий CEF:", e);
        }
      }

      delete window.toggleHud;
      delete window.toggleSpeedometer;
      delete window.toggleInventory;
      delete window.updateHUD;
      delete window.updateSpeedometer;
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
          <Speedometer 
            speed={speedoData.speed}
            fuel={speedoData.fuel}
            mileage={speedoData.mileage}
            hp={speedoData.hp}
            turnLeft={speedoData.turnLeft}
            lights={speedoData.lights}
            engine={speedoData.engine}
            parking={speedoData.parking}
            locked={speedoData.locked}
            turnRight={speedoData.turnRight}
          />
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