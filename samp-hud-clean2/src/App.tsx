import { useState, useEffect } from 'react';
import HUD from './components/HUD/HUD';
import Speedometer from './components/Speedometer/Speedometer';
import Inventory from './components/Inventory/Inventory';

// Расширяем интерфейс window для TypeScript, чтобы не было ошибок компиляции
declare global {
  interface Window {
    toggleHud?: (status: boolean) => void;
    toggleSpeedometer?: (status: boolean) => void;
    toggleInventory?: (status: boolean) => void;
  }
}

export default function App() {
  // ДЛЯ ТЕСТА: Худ всегда включен (true), спидометр и инвентарь скрыты (false)
  const [showHud, setShowHud] = useState<boolean>(true);
  const [showSpeedometer, setShowSpeedometer] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);

  useEffect(() => {
    // Регистрируем функции в глобальном объекте window для samp-ef

    // Функция переключения HUD
    window.toggleHud = (status: boolean) => {
      setShowHud(status);
    };

    // Функция переключения Спидометра
    window.toggleSpeedometer = (status: boolean) => {
      setShowSpeedometer(status);
    };

    // Функция переключения Инвентаря
    window.toggleInventory = (status: boolean) => {
      setShowInventory(status);
    };

    // Очистка при размонтировании компонента
    return () => {
      delete window.toggleHud;
      delete window.toggleSpeedometer;
      delete window.toggleInventory;
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', margin: 0, padding: 0 }}>
      
      {/* Твой HUD (Слой 1 — самый нижний) */}
      {showHud && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          <HUD />
        </div>
      )}

      {/* Твой Спидометр (Слой 2 — чуть выше) */}
      {showSpeedometer && (
        <div style={{ position: 'absolute', bottom: '50px', right: '50px', pointerEvents: 'none', zIndex: 2 }}>
          <Speedometer />
        </div>
      )}

      {/* Твой Инвентарь (Слой 9999 — самый верхний, перекрывает всё) */}
      {showInventory && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
          <Inventory />
        </div>
      )}

    </div>
  );
}