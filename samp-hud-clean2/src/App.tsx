import { useState, useEffect } from 'react';
import HUD from './components/HUD/HUD';
import Speedometer from './components/Speedometer/Speedometer';
import Inventory from './components/Inventory/Inventory';

// Описываем структуру данных из ТЗ
interface HudData {
  health?: number;
  armor?: number;
  hunger?: number;
  money?: number;
  playerId?: number;
  serverIndex?: number;
  serverName?: string;
  online?: number; // Количество игроков онлайн
}

declare global {
  interface Window {
    toggleHud?: (status: boolean) => void;
    toggleSpeedometer?: (status: boolean) => void;
    toggleInventory?: (status: boolean) => void;
    updateHUD?: (dataJson: string) => void; // Добавляем функцию из ТЗ
  }
}

export default function App() {
  const [showHud, setShowHud] = useState<boolean>(true);
  const [showSpeedometer, setShowSpeedometer] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);

  // Стейты для хранения данных HUD
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
    // Регистрация переключателей интерфейсов
    window.toggleHud = (status: boolean) => { setShowHud(status); };
    window.toggleSpeedometer = (status: boolean) => { setShowSpeedometer(status); };
    window.toggleInventory = (status: boolean) => { setShowInventory(status); };

    // ЕДИНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ ИЗ ТЗ
    window.updateHUD = (dataJsonString: string) => {
      try {
        const parsedData: HudData = JSON.parse(dataJsonString);
        
        // Обновляем только те ключи, которые пришли в JSON (выборочно)
        setHudData(prev => ({
          ...prev,
          ...parsedData
        }));
      } catch (error) {
        console.error("Ошибка парсинга JSON в updateHUD:", error);
      }
    };

    return () => {
      delete window.toggleHud;
      delete window.toggleSpeedometer;
      delete window.toggleInventory;
      delete window.updateHUD;
    };
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden', 
      margin: 0, 
      padding: 0,
      pointerEvents: 'none' 
    }}>
      
      {/* HUD — передаем все динамические данные пропсами внутрь компонента */}
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

      {/* Спидометр */}
      {showSpeedometer && (
        <div style={{ position: 'absolute', bottom: '50px', right: '50px', pointerEvents: 'none', zIndex: 2 }}>
          <Speedometer />
        </div>
      )}

      {/* Инвентарь */}
      {showInventory && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 9999,
          pointerEvents: 'auto' 
        }}>
          <Inventory />
        </div>
      )}

    </div>
  );
}