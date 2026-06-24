import React, { useState, useEffect, useRef } from 'react';
import logoSvg from './assets/logo.svg';

// --- НАСТРОЙКИ И ТИПЫ ДАННЫХ ---
interface MapCategory {
  id: number;
  icon: string;
  name: string;
}

interface MapProps {
  visible: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    cef?: any;
  }
}

const CATEGORIES: MapCategory[] = [
  { id: 1, icon: '📍', name: 'Ближайшие места' },
  { id: 2, icon: '⭐', name: 'Важные места' },
  { id: 3, icon: '💼', name: 'Работы и подработки' },
  { id: 4, icon: '🔰', name: 'Работы для новичков' },
  { id: 5, icon: '🚗', name: 'Покупка и аренда транспорта' },
  { id: 6, icon: '🏨', name: 'Отели' },
  { id: 7, icon: '🏠', name: 'Жилые комплексы и деревни' },
  { id: 8, icon: '📦', name: 'Разное' },
  { id: 9, icon: '🔧', name: 'Мастерские / Тех. обслуживание' },
  { id: 10, icon: '👕', name: 'Секонд-хенды' },
  { id: 11, icon: '🏭', name: 'Складские помещения' },
];

// --- СТИЛИ И АНИМАЦИИ (полностью скопированы из Pause.tsx) ---
const CSS_OPTIMIZATIONS = `
  @keyframes slideInLeft {
    0% { transform: translate3d(-100%, 0, 0); opacity: 0; }
    100% { transform: translate3d(0, 0, 0); opacity: 1; }
  }
  @keyframes fadeInUp {
    0% { transform: translate3d(0, 40px, 0); opacity: 0; }
    100% { transform: translate3d(0, 0, 0); opacity: 1; }
  }
  
  .animate-left-panel {
    animation: slideInLeft 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    backface-visibility: hidden;
    transform-style: preserve-3d;
  }
  .animate-card-1 {
    animation: fadeInUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: 0.04s;
    backface-visibility: hidden;
    transform-style: preserve-3d;
  }
  .animate-card-2 {
    animation: fadeInUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: 0.1s;
    backface-visibility: hidden;
    transform-style: preserve-3d;
  }

  .menu-btn {
    position: relative;
    width: 100%;
    height: 54px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    padding-left: 22px;
    font-weight: 900;
    letter-spacing: 0.06em;
    font-size: 1.05rem;
    border: none;
    outline: none;
    cursor: pointer;
    text-align: left;
    color: #7A7A80;
    background: rgba(255, 255, 255, 0.01);
    transition: color 0.12s ease;
    overflow: hidden;
    will-change: color;
    backface-visibility: hidden;
  }
  
  .menu-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(204, 157, 72, 0.85) 0%, rgba(106, 81, 35, 0.35) 100%);
    opacity: 0;
    transition: opacity 0.12s ease;
    z-index: 0;
    will-change: opacity;
  }

  .menu-btn-active {
    color: #ffffff !important;
  }
  
  .menu-btn-active::before {
    opacity: 1;
  }

  .menu-btn-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
  }
`;

const STYLES = {
  container: {
    position: 'fixed' as const,
    inset: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    color: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    boxSizing: 'border-box' as const,
  },
  darkOverlay: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
    zIndex: 0,
    backgroundColor: 'rgba(8, 8, 10, 0.25)',
  },
  mainContent: {
    width: '100%',
    height: 'calc(100vh - 60px)',
    display: 'flex',
    zIndex: 1,
    position: 'relative' as const,
  },
  leftPanel: {
    width: '40vw',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    paddingTop: '9vh',
    paddingLeft: '6vw',
    paddingRight: '2vw',
    background: 'linear-gradient(to right, #0A0A0B 0%, rgba(10, 10, 11, 0.98) 60%, rgba(10, 10, 11, 0.85) 85%, transparent 100%)',
    boxSizing: 'border-box' as const,
    opacity: 0,
    willChange: 'transform, opacity',
  },
  logoBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
    width: '310px',
    marginBottom: '5vh',
  },
  logoImgWrapper: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: '1.2rem',
  },
  logoImg: {
    maxWidth: '100%',
    maxHeight: '72px',
    objectFit: 'contain' as const,
  },
  logoDivider: {
    width: '85%',
    height: '1px',
    backgroundColor: 'rgba(204, 157, 72, 0.25)',
    marginBottom: '0.75rem',
  },
  logoSubtitle: {
    fontSize: '11px',
    letterSpacing: '0.6em',
    color: '#6A6A70',
    textTransform: 'uppercase' as const,
    fontWeight: 800,
    paddingLeft: '4px',
  },
  menuWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    width: '310px',
  },
  activeIndicator: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    backgroundColor: '#CC9D48',
    borderRadius: '6px 0 0 6px',
    zIndex: 2,
  },
  rightPanel: {
    width: '60vw',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center' as const,
    paddingRight: '5vw',
    gap: '24px',
    paddingBottom: '2vh',
    boxSizing: 'border-box' as const,
    backgroundColor: '#0d0e10',
    position: 'relative' as const,
  },
  bottomBar: {
    width: '100%',
    height: '60px',
    backgroundColor: '#060607',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#7A7A80',
    zIndex: 20,
    position: 'relative' as const,
    boxSizing: 'border-box' as const,
  },
  socials: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    paddingLeft: '5vw',
  },
  socialLink: {
    color: '#7A7A80',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 800,
  },
  socialPrefix: {
    color: 'rgba(255, 255, 255, 0.15)',
    fontWeight: 900,
  },
  socialSeparator: {
    color: 'rgba(255, 255, 255, 0.08)',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '24px',
    paddingRight: '5vw',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  controlLabel: {
    color: '#7A7A80',
    marginRight: '4px',
    fontWeight: 800,
  },
  keyCap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161618',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    padding: '2px 8px',
    minWidth: '24px',
    height: '20px',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: 900,
  },
  keyCapEnter: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161618',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    padding: '2px 10px',
    minWidth: '26px',
    height: '20px',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: 900,
  },
  keyCapEsc: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161618',
    border: '1px solid rgba(251, 146, 60, 0.25)',
    padding: '2px 8px',
    minWidth: '32px',
    height: '20px',
    borderRadius: '5px',
    fontSize: '10px',
    color: '#fb923c',
    fontFamily: 'monospace',
    fontWeight: 900,
  },
};

// --- КОМПОНЕНТ КАРТЫ ---
export const Map: React.FC<MapProps> = ({ visible, onClose }) => {
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number; heading: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [activeCategory, setActiveCategory] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const mapRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Подписка на обновление позиции
  useEffect(() => {
    if (!visible) return;

    const handleUpdateMap = (data: any) => {
      // ожидаем массив [x, y, heading]
      if (Array.isArray(data) && data.length >= 3) {
        setPlayerPos({
          x: data[0],
          y: data[1],
          heading: data[2],
        });
      }
    };

    if (window.cef) {
      window.cef.on('updateMap', handleUpdateMap);
      window.cef.emit('requestMapData');
    }

    return () => {
      if (window.cef) {
        window.cef.off('updateMap');
      }
    };
  }, [visible]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(5, Math.max(0.5, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
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

  if (!visible) return null;

  return (
    <div style={STYLES.container}>
      <style>{CSS_OPTIMIZATIONS}</style>
      <div style={STYLES.darkOverlay} />

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div style={STYLES.mainContent}>
        {/* ЛЕВАЯ ПАНЕЛЬ */}
        <div style={STYLES.leftPanel} className="animate-left-panel">
          <div style={STYLES.logoBlock}>
            <div style={STYLES.logoImgWrapper}>
              <img src={logoSvg} alt="Logo" style={STYLES.logoImg} />
            </div>
            <div style={STYLES.logoDivider} />
            <span style={STYLES.logoSubtitle}>Карта</span>
          </div>

          {/* Поиск */}
          <div style={{ width: '100%', marginBottom: '2vh' }}>
            <input
              type="text"
              placeholder="Поиск мест, фракций..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '12px 16px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Список категорий */}
          <div style={STYLES.menuWrapper}>
            {CATEGORIES.filter(cat =>
              cat.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((category, index) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`menu-btn ${isActive ? 'menu-btn-active' : ''} ${
                    index % 2 === 0 ? 'animate-card-1' : 'animate-card-2'
                  }`}
                >
                  {isActive && <div style={STYLES.activeIndicator} />}
                  <div className="menu-btn-content">
                    <span style={{ marginRight: '12px', fontSize: '1.2rem' }}>
                      {category.icon}
                    </span>
                    <span>{category.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: КАРТА */}
        <div
          style={{
            ...STYLES.rightPanel,
            overflow: 'hidden',
            padding: 0,
            justifyContent: 'flex-start',
            alignItems: 'stretch',
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
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
              transition: 'transform 0.02s linear',
              willChange: 'transform',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            {playerPos && (
              <div
                style={{
                  position: 'absolute',
                  left: `${((playerPos.x + 3000) / 6000) * 100}%`,
                  top: `${100 - ((playerPos.y + 3000) / 6000) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${-playerPos.heading}rad)`,
                  width: '22px',
                  height: '22px',
                  backgroundColor: '#CC9D48',
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 15px rgba(204, 157, 72, 0.8)',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderBottom: '9px solid #CC9D48',
                  }}
                />
              </div>
            )}
          </div>

          {/* Кнопка "ГДЕ Я?" */}
          <button
            onClick={() => {
              setOffset({ x: 0, y: 0 });
              setZoom(1.5);
            }}
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '40px',
              zIndex: 10,
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid #CC9D48',
              padding: '12px 24px',
              borderRadius: '6px',
              color: 'white',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            🎯 ГДЕ Я?
          </button>

          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 10,
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              opacity: 0.6,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            ✕
          </button>
        </div>
      </div>

      {/* НИЖНИЙ БАР */}
      <div style={STYLES.bottomBar}>
        <div style={STYLES.socials}>
          <span style={STYLES.socialLink}>
            <span style={STYLES.socialPrefix}>#</span> САЙТ
          </span>
          <span style={STYLES.socialLink}>
            <span style={STYLES.socialPrefix}>💬</span> ФОРУМ
          </span>
          <span style={STYLES.socialLink}>
            <span style={STYLES.socialPrefix}>📚</span> БАЗА ЗНАНИЙ
          </span>
          <span style={STYLES.socialSeparator}>|</span>
          <span style={STYLES.socialLink}>VK</span>
          <span style={STYLES.socialLink}>TELEGRAM</span>
          <span style={STYLES.socialLink}>DISCORD</span>
        </div>

        <div style={{ color: 'white', fontWeight: 700, fontSize: '12px' }}>
          КАРТА
        </div>

        <div style={STYLES.controls}>
          <div style={STYLES.controlGroup}>
            <span style={STYLES.controlLabel}>ЗУМ</span>
            <span style={STYLES.keyCap}>+</span>
            <span style={STYLES.keyCap}>−</span>
          </div>
          <div style={STYLES.controlGroup}>
            <span style={STYLES.controlLabel}>ПЕРЕМЕЩЕНИЕ</span>
            <span style={STYLES.keyCap}>ЛКМ</span>
          </div>
          <div style={STYLES.controlGroup}>
            <span style={STYLES.controlLabel}>ЗАКРЫТЬ</span>
            <span style={STYLES.keyCapEsc}>ESC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;