// src/components/Map/Map.tsx
import React, { useState, useEffect, useRef } from 'react';

interface MapProps {
  visible: boolean;
  onClose: () => void;
}

export const Map: React.FC<MapProps> = ({ visible, onClose }) => {
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number; heading: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Подписка на событие обновления позиции
  useEffect(() => {
    if (!visible) return;

    const handleUpdateMap = (data: any) => {
      // data приходит как массив? В Rust мы отправим JSON-строку или список аргументов.
      // Для простоты будем ожидать объект {x, y, heading}
      if (data && typeof data === 'object') {
        setPlayerPos({
          x: data.x || 0,
          y: data.y || 0,
          heading: data.heading || 0,
        });
      }
    };

    // Подписываемся на событие 'updateMap'
    if (window.cef) {
      window.cef.on('updateMap', handleUpdateMap);
    }

    // Запрашиваем начальные данные (если нужно)
    if (window.cef) {
      window.cef.emit('requestMapData');
    }

    return () => {
      if (window.cef) {
        window.cef.off('updateMap');
      }
    };
  }, [visible]);

  // Обработка зума колесом мыши
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(5, Math.max(0.5, prev + delta)));
  };

  // Панорамирование (drag)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Если карта не видна, не рендерим
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '90vw',
          height: '90vh',
          overflow: 'hidden',
          borderRadius: '12px',
          border: '2px solid rgba(255,255,255,0.1)',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Контейнер с картой и трансформациями */}
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/assets/map.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.05s linear',
            willChange: 'transform',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* Маркер игрока */}
          {playerPos && (
            <div
              style={{
                position: 'absolute',
                // Пересчёт координат GTA в проценты (предполагаем границы мира -3000..3000)
                left: `${((playerPos.x + 3000) / 6000) * 100}%`,
                top: `${100 - ((playerPos.y + 3000) / 6000) * 100}%`, // инвертируем Y
                transform: `translate(-50%, -50%) rotate(${-playerPos.heading}rad)`,
                width: '24px',
                height: '24px',
                backgroundColor: '#CC9D48',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 0 15px rgba(204, 157, 72, 0.6)',
                pointerEvents: 'none',
              }}
            >
              {/* Стрелка направления */}
              <div
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '0',
                  height: '0',
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '10px solid #CC9D48',
                }}
              />
            </div>
          )}
        </div>

        {/* Элементы управления (кнопки) */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            gap: '10px',
          }}
        >
          <button
            onClick={() => setZoom(prev => Math.min(5, prev + 0.2))}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            −
          </button>
        </div>

        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '28px',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Map;