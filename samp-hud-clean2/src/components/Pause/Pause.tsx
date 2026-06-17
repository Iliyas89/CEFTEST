import React, { useState, useEffect, useRef } from 'react';
import logoSvg from './assets/logo.svg';

// --- НАСТРОЙКИ И ТИПЫ ДАННЫХ ---
interface IMenuItem {
  id: string;
  label: string;
  action: string;
  isDanger?: boolean;
}

interface IUpdateCard {
  id: number;
}

declare global {
  interface Window {
    engine?: {
      call: (eventName: string, ...args: any[]) => void;
    };
    cef?: any;
  }
}

const MENU_ITEMS: IMenuItem[] = [
  { id: 'resume', label: 'ПРОДОЛЖИТЬ', action: 'server:pause:resume' },
  { id: 'map', label: 'КАРТА', action: 'server:pause:openMap' },
  { id: 'settings', label: 'НАСТРОЙКИ', action: 'server:pause:openSettings' },
  { id: 'reconnect', label: 'ПЕРЕЗАЙТИ', action: 'server:pause:reconnect' },
  { id: 'exit', label: 'ВЫЙТИ ИЗ ИГРЫ', action: 'server:pause:exitGame', isDanger: true },
];

const UPDATE_CARDS: IUpdateCard[] = [{ id: 1 }, { id: 2 }];

// --- СТИЛИ И АНИМАЦИИ ---
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
    position: 'fixed' as const, inset: 0, width: '100vw', height: '100vh',
    overflow: 'hidden', backgroundColor: 'transparent', 
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect: 'none' as const, WebkitUserSelect: 'none' as const, color: 'white',
    display: 'flex', flexDirection: 'column' as const, boxSizing: 'border-box' as const
  },
  darkOverlay: {
    position: 'absolute' as const, inset: 0, width: '100%', height: '100%',
    pointerEvents: 'none' as const, zIndex: 0, backgroundColor: 'rgba(8, 8, 10, 0.25)' 
  },
  mainContent: { 
    width: '100%', height: 'calc(100vh - 60px)', display: 'flex', zIndex: 1, position: 'relative' as const 
  },
  leftPanel: {
    width: '40vw', height: '100%', display: 'flex', flexDirection: 'column' as const,
    justifyContent: 'flex-start', paddingTop: '9vh', paddingLeft: '6vw', paddingRight: '2vw',
    background: 'linear-gradient(to right, #0A0A0B 0%, rgba(10, 10, 11, 0.98) 60%, rgba(10, 10, 11, 0.85) 85%, transparent 100%)',
    boxSizing: 'border-box' as const, opacity: 0, willChange: 'transform, opacity'
  },
  logoBlock: { 
    display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start' as const, width: '310px', marginBottom: '5vh' 
  },
  logoImgWrapper: { 
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '1.2rem' 
  },
  logoImg: { 
    maxWidth: '100%', maxHeight: '72px', objectFit: 'contain' as const 
  },
  logoDivider: { 
    width: '85%', height: '1px', backgroundColor: 'rgba(204, 157, 72, 0.25)', marginBottom: '0.75rem'
  },
  logoSubtitle: { 
    fontSize: '11px', letterSpacing: '0.6em', color: '#6A6A70', textTransform: 'uppercase' as const, fontWeight: 800, paddingLeft: '4px' 
  },
  menuWrapper: { 
    display: 'flex', flexDirection: 'column' as const, gap: '14px', width: '310px' 
  },
  activeIndicator: { 
    position: 'absolute' as const, left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#CC9D48', borderRadius: '6px 0 0 6px', zIndex: 2 
  },
  playIcon: { 
    width: '12px', height: '12px', marginRight: '10px', fill: 'currentColor', flexShrink: 0 
  },
  rightPanel: { 
    width: '60vw', height: '100%', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'flex-end' as const, paddingRight: '5vw', gap: '24px', paddingBottom: '2vh', boxSizing: 'border-box' as const 
  },
  card: {
    width: '430px', height: '220px', backgroundColor: 'rgba(16, 16, 18, 0.65)', borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const,
    justifyContent: 'center', alignItems: 'center', position: 'relative' as const, cursor: 'pointer',
    opacity: 0, willChange: 'transform, opacity'
  },
  cardBg: { 
    position: 'absolute' as const, inset: 0, width: '100%', height: '100%', zIndex: 0, background: 'radial-gradient(circle at center, rgba(30,30,35,0.2) 0%, rgba(18,18,20,0.7) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
  },
  cardIcon: { 
    width: '54px', height: '54px', color: 'rgba(255, 255, 255, 0.03)' 
  },
  bottomBar: {
    width: '100%', height: '60px', backgroundColor: '#060607', borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
    fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#7A7A80', zIndex: 20, position: 'relative' as const,
    boxSizing: 'border-box' as const
  },
  socials: { 
    display: 'flex', alignItems: 'center', gap: '24px', paddingLeft: '5vw' 
  },
  socialLink: { 
    color: '#7A7A80', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 
  },
  socialPrefix: { 
    color: 'rgba(255, 255, 255, 0.15)', fontWeight: 900 
  },
  socialSeparator: { 
    color: 'rgba(255, 255, 255, 0.08)' 
  },
  timerContainer: { 
    display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: 900, fontSize: '11.5px' 
  },
  timerText: { 
    letterSpacing: '0.12em' 
  },
  timerBadge: { 
    backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '3px 9px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' as const, border: '1px solid rgba(255,255,255,0.03)' 
  },
  controls: { 
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '24px', paddingRight: '5vw', color: 'rgba(255, 255, 255, 0.85)' 
  },
  controlGroup: { 
    display: 'flex', alignItems: 'center', gap: '6px' 
  },
  controlLabel: { 
    color: '#7A7A80', marginRight: '4px', fontWeight: 800 
  },
  keyCap: { 
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161618', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '2px 8px', minWidth: '24px', height: '20px', borderRadius: '5px', fontSize: '11px', fontWeight: 900 
  },
  keyCapEnter: { 
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161618', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '2px 10px', minWidth: '26px', height: '20px', borderRadius: '5px', fontSize: '11px', fontWeight: 900 
  },
  keyCapEsc: { 
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161618', border: '1px solid rgba(251, 146, 60, 0.25)', padding: '2px 8px', minWidth: '32px', height: '20px', borderRadius: '5px', fontSize: '10px', color: '#fb923c', fontFamily: 'monospace', fontWeight: 900 
  }
};

// --- ИЗОЛИРОВАННЫЙ ТАЙМЕР ---
const Timer: React.FC = () => {
  const [time, setTime] = useState<string>('00:00');

  useEffect(() => {
    const start = Date.now();
    const timerInterval = setInterval(() => {
      const diff = Date.now() - start;
      const minutes = Math.floor(diff / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTime(`${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  return <span style={STYLES.timerBadge}>{time}</span>;
};

// --- МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ ---
const ConfirmDialog: React.FC<{
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ visible, onConfirm, onCancel }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#161618',
        borderRadius: '12px',
        padding: '32px 40px',
        maxWidth: '400px',
        width: '90%',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      }}>
        <h3 style={{
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 700,
          margin: '0 0 8px 0',
          letterSpacing: '0.02em',
        }}>Выход из игры</h3>
        <p style={{
          color: '#A0A0A8',
          fontSize: '0.95rem',
          margin: '0 0 24px 0',
          lineHeight: '1.5',
        }}>
          Вы действительно хотите выйти из игры?
        </p>
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: '#A0A0A8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ОТМЕНА
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              background: '#CC9D48',
              color: '#0A0A0B',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            ДА
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('resume');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const activeTabRef = useRef<string>(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Функция для отправки событий в клиент (серверные команды)
  const triggerClient = (action: string, sound: 'click' | 'hover') => {
    if (window.engine) {
      window.engine.call('cef:pause:playSound', sound);
      if (action !== '') window.engine.call(action);
    } else {
      console.log(`[CEF Debug] Action: ${action} | Sound: ${sound}`);
    }
  };

  // === ИСПРАВЛЕНО: закрытие паузы с аргументом 0 ===
  const closePause = () => {
    if (window.cef) {
      window.cef.emit('togglePause', 0);
    } else {
      console.warn('[Pause] window.cef недоступен');
    }
  };

  // Обработчик клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTab = activeTabRef.current;
      const currentIndex = MENU_ITEMS.findIndex(item => item.id === currentTab);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % MENU_ITEMS.length;
        setActiveTab(MENU_ITEMS[nextIndex].id);
        triggerClient('', 'hover');
      } 
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
        setActiveTab(MENU_ITEMS[prevIndex].id);
        triggerClient('', 'hover');
      } 
      else if (e.key === 'Enter') {
        e.preventDefault();
        const currentItem = MENU_ITEMS[currentIndex];
        if (!currentItem) return;

        if (currentItem.id === 'exit') {
          setShowConfirm(true);
        } else {
          if (currentItem.id === 'resume') {
            closePause();
          }
          triggerClient(currentItem.action, 'click');
        }
      } 
      else if (e.key === 'Escape') {
        e.preventDefault();
        closePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Обработчик клика по пункту меню
  const handleMenuItemClick = (item: IMenuItem) => {
    if (item.id === 'exit') {
      setShowConfirm(true);
      return;
    }

    if (item.id === 'resume') {
      closePause();
    }
    triggerClient(item.action, 'click');
  };

  const handleConfirmExit = () => {
    // Отправляем команду на сервер
    triggerClient('server:pause:exitGame', 'click');
    // Закрываем паузу и выходим из игры
    if (window.cef) {
      window.cef.emit('exitGame');
      window.cef.emit('togglePause', 0);
    }
    setShowConfirm(false);
  };

  const handleCancelExit = () => {
    setShowConfirm(false);
  };

  return (
    <div style={STYLES.container}>
      <style>{CSS_OPTIMIZATIONS}</style>
      
      <div style={STYLES.darkOverlay} />

      {/* Модальное окно подтверждения */}
      <ConfirmDialog
        visible={showConfirm}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div style={STYLES.mainContent}>
        
        {/* ЛЕВАЯ ПАНЕЛЬ */}
        <div style={STYLES.leftPanel} className="animate-left-panel">
          {/* Логотип */}
          <div style={STYLES.logoBlock}>
            <div style={STYLES.logoImgWrapper}>
              <img src={logoSvg} alt="Logo" style={STYLES.logoImg} />
            </div>
            <div style={STYLES.logoDivider} />
            <span style={STYLES.logoSubtitle}>Меню паузы</span>
          </div>

          {/* Пункты Меню */}
          <div style={STYLES.menuWrapper}>
            {MENU_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item)}
                  onMouseEnter={() => {
                    if (activeTabRef.current !== item.id) {
                      setActiveTab(item.id);
                      triggerClient('', 'hover');
                    }
                  }}
                  className={`menu-btn ${isActive ? 'menu-btn-active' : ''}`}
                >
                  {isActive && <div style={STYLES.activeIndicator} />}

                  <div className="menu-btn-content">
                    {isActive && item.id === 'resume' && (
                      <svg style={STYLES.playIcon} viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}

                    <span style={{ color: item.isDanger && !isActive ? '#A24444' : 'inherit' }}>
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ */}
        <div style={STYLES.rightPanel}>
          {UPDATE_CARDS.map((card) => (
            <div
              key={card.id}
              style={STYLES.card}
              className={`animate-card-${card.id}`}
            >
              <div style={STYLES.cardBg}>
                <svg style={STYLES.cardIcon} fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* НИЖНИЙ БАР */}
      <div style={STYLES.bottomBar}>
        
        <div style={STYLES.socials}>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:site', 'click')} style={STYLES.socialLink}>
            <span style={STYLES.socialPrefix}>#</span> САЙТ
          </a>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:forum', 'click')} style={STYLES.socialLink}>
            <span style={STYLES.socialPrefix}>💬</span> ФОРУМ
          </a>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:wiki', 'click')} style={STYLES.socialLink}>
            <span style={STYLES.socialPrefix}>📚</span> БАЗА ЗНАНИЙ
          </a>
          <span style={STYLES.socialSeparator}>|</span>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:vk', 'click')} style={STYLES.socialLink}>VK</a>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:tg', 'click')} style={STYLES.socialLink}>TELEGRAM</a>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:discord', 'click')} style={STYLES.socialLink}>DISCORD</a>
        </div>

        <div style={STYLES.timerContainer}>
          <span style={STYLES.timerText}>ВЫ НА ПАУЗЕ</span>
          <Timer />
        </div>

        <div style={STYLES.controls}>
          <div style={STYLES.controlGroup}>
            <span style={STYLES.controlLabel}>ЛИСТАТЬ</span>
            <span style={STYLES.keyCap}>↑</span>
            <span style={STYLES.keyCap}>↓</span>
          </div>

          <div style={STYLES.controlGroup}>
            <span style={STYLES.controlLabel}>ВЫБРАТЬ</span>
            <span style={STYLES.keyCapEnter}>↵</span>
          </div>

          <div style={STYLES.controlGroup}>
            <span style={STYLES.controlLabel}>НАЗАД</span>
            <span style={STYLES.keyCapEsc}>ESC</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;