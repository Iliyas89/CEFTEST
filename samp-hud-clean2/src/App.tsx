import { useState, useEffect } from 'react';
import HUD from './components/HUD/HUD';
import Speedometer from './components/Speedometer/Speedometer';
import Inventory from './components/Inventory/Inventory';

declare global {
  interface Window {
    toggleHud?: (status: boolean) => void;
    toggleSpeedometer?: (status: boolean) => void;
    toggleInventory?: (status: boolean) => void;
  }
}

export default function App() {
  const [showHud, setShowHud] = useState<boolean>(true);
  const [showSpeedometer, setShowSpeedometer] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);

  useEffect(() => {
    window.toggleHud = (status: boolean) => { setShowHud(status); };
    window.toggleSpeedometer = (status: boolean) => { setShowSpeedometer(status); };
    window.toggleInventory = (status: boolean) => { setShowInventory(status); };

    return () => {
      delete window.toggleHud;
      delete window.toggleSpeedometer;
      delete window.toggleInventory;
    };
  }, []);

  return (
    /* КРИТИЧЕСКИЙ ФИКС: pointerEvents: 'none' на главном контейнере.
      Теперь клики спокойно проходят сквозь CEF в саму игру и в самповские диалоги!
    */
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden', 
      margin: 0, 
      padding: 0,
      pointerEvents: 'none' 
    }}>
      
      {/* HUD (клики проходят сквозь, управлять им мышкой не нужно) */}
      {showHud && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          <HUD />
        </div>
      )}

      {/* Спидометр (тоже прозрачен для кликов) */}
      {showSpeedometer && (
        <div style={{ position: 'absolute', bottom: '50px', right: '50px', pointerEvents: 'none', zIndex: 2 }}>
          <Speedometer />
        </div>
      )}

      {/* Инвентарь (А вот тут мышка НУЖНА, поэтому возвращаем pointerEvents: 'auto') */}
      {showInventory && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 9999,
          pointerEvents: 'auto' /* Мышка снова работает внутри инвентаря! */
        }}>
          <Inventory />
        </div>
      )}

    </div>
  );
}