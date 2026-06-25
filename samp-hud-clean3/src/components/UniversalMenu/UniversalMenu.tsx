import React, { useState, useRef, useEffect } from 'react';
import styles from './UniversalMenu.module.css';

interface MenuButton {
  id: number;
  text: string;
  style?: 'primary' | 'secondary' | 'danger';
}

interface MenuConfig {
  title: string;
  content: string;
  type: 'DIALOG' | 'LIST';
  listItems: string[];
  buttons: MenuButton[];
}

interface UniversalMenuProps {
  config: MenuConfig;
  onClose: () => void;
}

export default function UniversalMenu({ config, onClose }: UniversalMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Сброс параметров при изменении конфига
  useEffect(() => {
    setSelectedIndex(0);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [config]);

  // Устанавливаем фокус при открытии
  useEffect(() => {
    const globalWindow = window as any;
    if (globalWindow.cef && globalWindow.cef.emit) {
      globalWindow.cef.emit('focusBrowser', 1);
    }
  }, []);

  // Главный обработчик отправки данных в Pawn при клике на кнопки внизу
  const handleButtonClick = (e: React.MouseEvent, buttonId: number) => {
    e.preventDefault();
    e.stopPropagation();

    const response = {
      buttonId: buttonId,
      selectedIndex: config.type === 'LIST' ? selectedIndex : -1
    };

    console.log("CEF Output to Pawn:", response);

    const globalWindow = window as any;
    if (globalWindow.cef && globalWindow.cef.emit) {
      globalWindow.cef.emit('universalMenu:callback', JSON.stringify(response));
    }

    if (globalWindow.cef && globalWindow.cef.emit) {
      globalWindow.cef.emit('focusBrowser', 0);
    }
    setTimeout(() => {
      onClose();
    }, 50);
  };

  // ИСПРАВЛЕНО: Логика отмены (нажатие на Крестик, ESC или клик по фону)
  const handleCancelAction = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const globalWindow = window as any;
    if (globalWindow.cef && globalWindow.cef.emit) {
      globalWindow.cef.emit('focusBrowser', 0);
    }

    // Всегда отправляем -1, сигнализируя серверу о закрытии окна без выбора опций
    const response = {
      buttonId: -1,
      selectedIndex: -1
    };
    
    console.log("CEF Output to Pawn (cancel via Cross/Esc):", response);

    if (globalWindow.cef && globalWindow.cef.emit) {
      globalWindow.cef.emit('universalMenu:callback', JSON.stringify(response));
    }

    setTimeout(() => {
      onClose();
    }, 50);
  };

  // Хоткеи: Управление с клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (config.type === 'LIST' && config.listItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => {
            const nextIdx = Math.min(config.listItems.length - 1, prev + 1);
            const itemEl = contentRef.current?.children[1]?.children[nextIdx] as HTMLElement;
            if (itemEl && contentRef.current) {
              contentRef.current.scrollTop = itemEl.offsetTop - 150;
            }
            return nextIdx;
          });
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => {
            const nextIdx = Math.max(0, prev - 1);
            const itemEl = contentRef.current?.children[1]?.children[nextIdx] as HTMLElement;
            if (itemEl && contentRef.current) {
              contentRef.current.scrollTop = itemEl.offsetTop - 150;
            }
            return nextIdx;
          });
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const primaryBtn = config.buttons.find(b => b.style === 'primary') || config.buttons[0];
        if (primaryBtn) {
          const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent;
          handleButtonClick(fakeEvent, primaryBtn.id);
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, selectedIndex]);

  return (
    <div 
      className={styles.menuOverlay} 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancelAction(e);
        }
      }}
    >
      <div className={`${styles.menuWindow} ${styles.animateAppear}`}>
        
        {/* КРЕСТИК ЗАКРЫТИЯ */}
        <button 
          className={styles.closeCross} 
          onClick={(e) => handleCancelAction(e)} 
          title="Закрыть (Esc)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* ХЕДЕР */}
        <div className={styles.menuHeader}>
          <span className={styles.menuTitle}>{config.title.toUpperCase()}</span>
          <div className={styles.menuHeaderLine}></div>
        </div>

        {/* ТЕЛО ОКНА */}
        <div className={styles.menuBody} ref={contentRef}>
          {config.content && (
            <p className={styles.menuTextContent}>{config.content}</p>
          )}

          {config.type === 'LIST' && config.listItems.length > 0 && (
            <div className={styles.menuList}>
              {config.listItems.map((item, index) => (
                <div
                  key={index}
                  className={`${styles.menuListItem} ${selectedIndex === index ? styles.active : ''}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span className={styles.itemNumber}>{String(index + 1).padStart(2, '0')}.</span>
                  <span className={styles.itemText}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ПОДВАЛ */}
        {config.buttons && config.buttons.length > 0 && (
          <div className={styles.menuFooter}>
            {config.buttons.map((btn) => {
              let btnStyleClass = styles.btnSecondary;
              if (btn.style === 'primary') btnStyleClass = styles.btnPrimary;
              if (btn.style === 'danger') btnStyleClass = styles.btnDanger;

              return (
                <button
                  key={btn.id}
                  className={`${styles.menuBtn} ${btnStyleClass}`}
                  onClick={(e) => handleButtonClick(e, btn.id)}
                >
                  {btn.text}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}