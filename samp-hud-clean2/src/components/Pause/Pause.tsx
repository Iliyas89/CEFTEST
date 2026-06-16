import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  imageUrl: string;
}

declare global {
  interface Window {
    engine?: {
      call: (eventName: string, ...args: any[]) => void;
    };
  }
}

const MENU_ITEMS: IMenuItem[] = [
  { id: 'resume', label: 'ПРОДОЛЖИТЬ', action: 'server:pause:resume' },
  { id: 'map', label: 'КАРТА', action: 'server:pause:openMap' },
  { id: 'settings', label: 'НАСТРОЙКИ', action: 'server:pause:openSettings' },
  { id: 'reconnect', label: 'ПЕРЕЗАЙТИ', action: 'server:pause:reconnect' },
  { id: 'exit', label: 'ВЫЙТИ ИЗ ИГРЫ', action: 'server:pause:exitGame', isDanger: true },
];

const UPDATE_CARDS: IUpdateCard[] = [
  { id: 1, imageUrl: '' },
  { id: 2, imageUrl: '' },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('resume');
  const [time, setTime] = useState<string>('00:00');

  // Функция отправки событий в клиент игры
  const triggerClient = (action: string, sound: 'click' | 'hover') => {
    if (window.engine) {
      window.engine.call('cef:pause:playSound', sound);
      if (action !== '') window.engine.call(action);
    } else {
      console.log(`[CEF Debug] Action: ${action} | Sound: ${sound}`);
    }
  };

  // Таймер нахождения на паузе
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

  // ОБРАБОТЧИК КЛАВИАТУРЫ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = MENU_ITEMS.findIndex(item => item.id === activeTab);

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
        if (currentItem) {
          triggerClient(currentItem.action, 'click');
        }
      } 
      else if (e.key === 'Escape') {
        e.preventDefault();
        triggerClient('server:pause:resume', 'click');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div style={{
      position: 'fixed', inset: 0, width: '100vw', height: '100vh',
      overflow: 'hidden', backgroundColor: 'transparent', 
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: 'none', WebkitUserSelect: 'none', color: 'white',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
    }}>
      
      {/* Мягкое размытие заднего фона без резких линий и масок */}
      <div style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
      }} />

      {/* ОСНОВНОЙ КОНТЕНТ (Верхняя часть) */}
      <div style={{ width: '100%', height: 'calc(100vh - 60px)', display: 'flex', zIndex: 1, position: 'relative' }}>
        
        {/* ЛЕВАЯ ПАНЕЛЬ */}
        <motion.div 
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
          style={{
            width: '40vw', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-start', paddingTop: '9vh', paddingLeft: '6vw', paddingRight: '2vw',
            background: 'linear-gradient(to right, #0A0A0B 0%, rgba(10, 10, 11, 0.98) 60%, rgba(10, 10, 11, 0.85) 85%, transparent 100%)',
            boxSizing: 'border-box'
          }}
        >
          {/* Логотип */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '310px', marginBottom: '5vh' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '1.2rem' }}>
              <img src={logoSvg} alt="Logo" style={{ maxWidth: '100%', maxHeight: '72px', objectFit: 'contain' }} />
            </div>
            <div style={{ width: '85%', height: '1px', backgroundColor: 'rgba(204, 157, 72, 0.25)', marginBottom: '0.75rem', boxShadow: '0 0 10px 1px rgba(204, 157, 72, 0.2)' }} />
            <span style={{ fontSize: '11px', letterSpacing: '0.6em', color: '#6A6A70', textTransform: 'uppercase', fontWeight: 800, paddingLeft: '4px' }}>
              Меню паузы
            </span>
          </div>

          {/* Пункты Меню */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '310px' }}>
            {MENU_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    triggerClient(item.action, 'click');
                  }}
                  onMouseEnter={() => {
                    setActiveTab(item.id);
                    triggerClient('', 'hover');
                  }}
                  
                  whileHover={{ 
                    boxShadow: isActive ? '0 6px 20px rgba(204, 157, 72, 0.3)' : 'inset 0 0 8px rgba(255, 255, 255, 0.03)'
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  
                  style={{
                    position: 'relative', width: '100%', height: '54px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', paddingLeft: '22px', fontWeight: 900,
                    letterSpacing: '0.06em', fontSize: '1.05rem', border: 'none', outline: 'none', cursor: 'pointer',
                    color: isActive ? 'white' : '#7A7A80',
                    background: isActive ? 'linear-gradient(90deg, rgba(204, 157, 72, 0.85) 0%, rgba(106, 81, 35, 0.35) 100%)' : 'rgba(255, 255, 255, 0.01)',
                    boxShadow: isActive ? '0 4px 15px rgba(0, 0, 0, 0.2)' : 'none',
                    textAlign: 'left',
                    transition: 'color 0.2s ease, background 0.2s ease'
                  }}
                >
                  {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#CC9D48', borderRadius: '4px 0 0 4px' }} />}

                  {isActive && item.id === 'resume' && (
                    <svg style={{ width: '12px', height: '12px', marginRight: '10px', fill: 'currentColor', flexShrink: 0 }} viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}

                  <span style={{ color: item.isDanger && !isActive ? '#A24444' : 'inherit', transition: 'color 0.2s' }}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ПРАВАЯ ЧАСТЬ (Чистые Карточки) */}
        <div style={{ width: '60vw', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', paddingRight: '5vw', gap: '24px', paddingBottom: '2vh', boxSizing: 'border-box' }}>
          {UPDATE_CARDS.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: card.id * 0.08 }}
              style={{
                width: '430px', height: '220px', backgroundColor: 'rgba(16, 16, 18, 0.45)', borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', position: 'relative', cursor: 'pointer', backdropFilter: 'blur(12px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
              }}
            >
              <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, background: 'radial-gradient(circle at center, rgba(30,30,35,0.2) 0%, rgba(18,18,20,0.7) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '54px', height: '54px', color: 'rgba(255, 255, 255, 0.03)' }} fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* НИЖНИЙ БАР (Исправленная 3-блочная Grid сетка) */}
      <div style={{
        width: '100%', height: '60px', backgroundColor: '#060607', borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#7A7A80', zIndex: 20, position: 'relative',
        boxSizing: 'border-box'
      }}>
        
        {/* Блок 1: Соцсети (Слева) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingLeft: '5vw' }}>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:site', 'click')} style={{ color: '#7A7A80', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontWeight: 900 }}>#</span> САЙТ
          </a>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:forum', 'click')} style={{ color: '#7A7A80', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>💬</span> ФОРУМ
          </a>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:wiki', 'click')} style={{ color: '#7A7A80', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>📚</span> БАЗА ЗНАНИЙ
          </a>
          <span style={{ color: 'rgba(255, 255, 255, 0.08)' }}>|</span>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:vk', 'click')} style={{ color: '#7A7A80', textDecoration: 'none', fontWeight: 800 }}>VK</a>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:tg', 'click')} style={{ color: '#7A7A80', textDecoration: 'none', fontWeight: 800 }}>TELEGRAM</a>
          <a href="#" onClick={() => triggerClient('server:pause:openUrl:discord', 'click')} style={{ color: '#7A7A80', textDecoration: 'none', fontWeight: 800 }}>DISCORD</a>
        </div>

        {/* Блок 2: Таймер (Жестко по центру) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: 900, fontSize: '11.5px' }}>
          <span style={{ letterSpacing: '0.12em' }}>ВЫ НА ПАУЗЕ</span>
          <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '3px 9px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.03)' }}>
            {time}
          </span>
        </div>

        {/* Блок 3: Клавиши (Справа) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '24px', paddingRight: '5vw', color: 'rgba(255, 255, 255, 0.85)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#7A7A80', marginRight: '4px', fontWeight: 800 }}>ЛИСТАТЬ</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161618', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '2px 8px', minWidth: '24px', height: '20px', borderRadius: '5px', fontSize: '11px', fontWeight: 900 }}>↑</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161618', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '2px 8px', minWidth: '24px', height: '20px', borderRadius: '5px', fontSize: '11px', fontWeight: 900 }}>↓</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#7A7A80', marginRight: '4px', fontWeight: 800 }}>ВЫБРАТЬ</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161618', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '2px 10px', minWidth: '26px', height: '20px', borderRadius: '5px', fontSize: '11px', fontWeight: 900 }}>↵</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#7A7A80', marginRight: '4px', fontWeight: 800 }}>НАЗАД</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161618', border: '1px solid rgba(251, 146, 60, 0.25)', padding: '2px 8px', minWidth: '32px', height: '20px', borderRadius: '5px', fontSize: '10px', color: '#fb923c', fontFamily: 'monospace', fontWeight: 900 }}>ESC</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;