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

  useEffect(() => {
    // 1. Прямые вызовы через window (оставляем для обратной совместимости или ручных тестов)
    window.toggleHud = (status: boolean) => setShowHud(status);
    window.toggleSpeedometer = (status: boolean) => setShowSpeedometer(status);
    window.toggleInventory = (status: boolean) => setShowInventory(status);

    // Функция парсинга и обновления данных HUD
    const processHudData = (dataJsonString: string | object) => {
      try {
        const parsedData: HudData = typeof dataJsonString === 'string' 
          ? JSON.parse(dataJsonString) 
          : dataJsonString;
        console.log("[CEF] Данные HUD успешно обновлены сервером:", parsedData);
        
        setHudData(prev => ({ ...prev, ...parsedData }));
      } catch (error) {
        console.error("Ошибка парсинга JSON в updateHUD:", error);
      }
    };

    window.updateHUD = processHudData;

    // Нативные функции-обработчики, которые корректно разбирают аргументы от плагина
    const parseCefStatus = (rawVal: any): boolean => {
      const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
      return val === 1 || val === true || val === "1";
    };

    // === СИСТЕМНЫЙ ИНТЕРВАЛ ДЛЯ ИНИЦИАЛИЗАЦИИ ВЗАИМОДЕЙСТВИЯ С CEF ===
    let checkCefInterval = setInterval(() => {
      if (window.cef) {
        console.log("[App] Плагин CEF успешно обнаружен в процессе игры!");
        
        // ПОДПИСКА НА КАСТОМНЫЕ СОБЫТИЯ СЕРВЕРА (cef_emit_event) НАПРЯМУЮ ЧЕРЕЗ ПЛАГИН
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

        window.cef.on('toggleInventory', (rawVal: any) => {
          setShowInventory(parseCefStatus(rawVal));
        });

        // СИСТЕМНЫЕ ОБНОВЛЕНИЯ ХАРАКТЕРИСТИК (game:data:playerStats)
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
        
        // Уведомляем сервер, что подписки оформлены и фронтенд готов на 100%
        window.cef.emit("OnCefInterfaceReady");
        
        clearInterval(checkCefInterval);
      }
    }, 100);


    // === СИМУЛЯТОР ДЛЯ ДЕВЕЛОПМЕНТА (ЛОКАЛЬНЫЙ БРАУЗЕР) ===
    let simInterval: any = null;
    const isBrowserTesting = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isBrowserTesting && !window.cef) {
      console.log("[App] Включена симуляция для теста в браузере. Автоматически показываем HUD.");
      setShowHud(true);

      simInterval = setInterval(() => {
        setHudData(prev => ({
          ...prev,
          hunger: Math.max(10, (prev.hunger ?? 100) - 1)
        }));
      }, 5000);
    }

    // === ОЧИСТКА ===
    return () => {
      clearInterval(checkCefInterval);
      if (simInterval) clearInterval(simInterval);
      
      // Сбрасываем подписки, если объект CEF существует во время релоада
      if (window.cef) {
        try {
          window.cef.off('toggleHud');
          window.cef.off('updateHUD');
          window.cef.off('toggleSpeedometer');
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