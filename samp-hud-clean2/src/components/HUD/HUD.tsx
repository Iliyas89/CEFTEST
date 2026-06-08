import { useState, useEffect } from 'react';
import styles from './HUD.module.css';

// Импорт SVG-иконок
import userSvg from './assets/user.svg';
import logoSvg from './assets/logo.svg'; 
import projectTextSvg from './assets/project_text.svg'; 
import heartSvg from './assets/heart.svg';
import armorSvg from './assets/armor.svg';
import burgerSvg from './assets/burger.svg';
import dollarSvg from './assets/dollar.svg';

// Функция для расчёта заполнения кругового прогресс-бара
const calculateOffset = (value: number) => {
  const radius = 25.5;
  const circumference = 2 * Math.PI * radius;
  return circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
};

// Функция для красивого форматирования денег с пробелами
const formatMoney = (amount: number) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export default function HUD() {
  // Динамические состояния для параметров игрока и сервера
  const [health, setHealth] = useState<number>(100);
  const [armor, setArmor] = useState<number>(0); // По умолчанию броня 0
  const [hunger, setHunger] = useState<number>(100);
  const [serverIndex, setServerIndex] = useState<number>(1);
  const [serverName, setServerName] = useState<string>("AVALON"); 
  const [playerId, setPlayerId] = useState<number>(0);
  const [money, setMoney] = useState<number>(0);
  const [online, setOnline] = useState<number>(1); 

  // Стейты для анимации изменения денег
  const [moneyChange, setMoneyChange] = useState<number | null>(null);
  const [changeType, setChangeType] = useState<'add' | 'sub' | null>(null);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [prevMoney, setPrevMoney] = useState<number>(money);

  const circumference = 2 * Math.PI * 25.5;

  // Отслеживаем изменения баланса и запускаем анимацию вылета
  useEffect(() => {
    if (money !== prevMoney) {
      const diff = money - prevMoney;
      setMoneyChange(Math.abs(diff));
      setChangeType(diff > 0 ? 'add' : 'sub');
      setAnimationKey(prev => prev + 1);
      setPrevMoney(money);
    }
  }, [money, prevMoney]);

  useEffect(() => {
    // Проверяем, запущены ли мы внутри игры (samp-ef / CEF)
    const isRunningInGame = (window as any).cef !== undefined || (window as any).mp !== undefined;

    // ГЛОБАЛЬНЫЙ МОСТ ДЛЯ СЕРВЕРА (Принимает данные от Pawn)
    const handleHUDUpdate = (dataJson: string | object) => {
      try {
        // Защита: если плагин передал уже готовый объект, не парсим его как строку
        const data = typeof dataJson === 'string' ? JSON.parse(dataJson) : dataJson;
        
        if (data.health !== undefined) setHealth(data.health);
        if (data.armor !== undefined) setArmor(data.armor);
        if (data.hunger !== undefined) setHunger(data.hunger);
        if (data.serverIndex !== undefined) setServerIndex(data.serverIndex);
        if (data.serverName !== undefined) setServerName(data.serverName);
        if (data.playerId !== undefined) setPlayerId(data.playerId);
        if (data.money !== undefined) setMoney(data.money);
        if (data.online !== undefined) setOnline(data.online);
      } catch (error) {
        console.error("Ошибка при разборе данных HUD:", error);
      }
    };

    // Локальное чтение ХП и Брони из клиента игры (Высокая частота без участия сервера)
    const handleLocalStatsUpdate = (localHp: number, localArmor: number) => {
      if (localHp !== undefined) setHealth(Math.round(localHp));
      if (localArmor !== undefined) setArmor(Math.round(localArmor));
    };

    // Регистрируем функции в глобальном window, чтобы их видел плагин игры
    (window as any).updateHUD = handleHUDUpdate;
    (window as any).updateLocalStats = handleLocalStatsUpdate;

    let testInterval: any = null;
    let up = true; 
    const testNames = ["AVALON ROLEPLAY", "AVALON | NEVADA", "DEVELOPMENT"];

    if (!isRunningInGame) {
      console.log("[HUD] Умный симулятор для браузера запущен.");
      
      testInterval = setInterval(() => {
        setHealth(prev => (up ? (prev > 95 ? 95 : prev + 5) : (prev < 40 ? 40 : prev - 5)));
        setArmor(prev => (up ? (prev > 85 ? 85 : prev + 8) : (prev < 15 ? 15 : prev - 8)));
        setHunger(prev => (up ? (prev > 90 ? 90 : prev + 4) : (prev < 30 ? 30 : prev - 4)));

        setMoney(prev => {
          const change = Math.floor(Math.random() * 5000) + 500;
          return Math.random() > 0.5 ? prev + change : Math.max(0, prev - change);
        });

        setOnline(Math.floor(Math.random() * 200) + 100);         
        setPlayerId(15);       
        setServerIndex(1);
        setServerName(testNames[Math.floor(Math.random() * testNames.length)]);

        if (Math.random() > 0.85) {
          up = !up;
        }
      }, 3000);
    } else {
      // Если мы в игре, запускаем локальный таймер-клиент, который будет каждую секунду
      // дергать встроенные свойства Chromium для получения актуального ХП/Брони персонажа,
      // если твой плагин это поддерживает через window.cef
      if ((window as any).cef && (window as any).cef.getHp) {
        testInterval = setInterval(() => {
          const hp = (window as any).cef.getHp();
          const arm = (window as any).cef.getArmour();
          handleLocalStatsUpdate(hp, arm);
        }, 200); // 200мс — идеальный баланс между плавностью и производительностью
      }
    }

    return () => {
      (window as any).updateHUD = null;
      (window as any).updateLocalStats = null;
      if (testInterval) clearInterval(testInterval);
    };
  }, []);

  const SmoothWave = ({ colorClass }: { colorClass: string }) => (
    <svg 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none" 
      className={`${styles.smoothWaveSvg} ${colorClass}`}
    >
      <path d="M0,65 C30,55 70,75 100,65 L100,100 L0,100 Z" />
    </svg>
  );

  return (
    <div className={styles.root}>
      
      {/* ВЕРХНЯЯ ПАНЕЛЬ С УМНОЙ АВТО-ПОДСТРОЙКОЙ (FLEX) */}
      <div className={styles.header}>
        
        {/* ЛЕВЫЙ БЛОК: Игрок */}
        <div className={styles.userContainer}>
          <div className={styles.onlineRow}>
            <img src={userSvg} className={styles.userIcon} alt="" />
            <span className={styles.onlineText}>{online} / 1000</span>
          </div>
          <span className={styles.userIdText}>ID {playerId}</span>
        </div>
        
        {/* ЦЕНТРАЛЬНЫЙ БЛОК: Брендинг */}
        <div className={styles.brandRow}>
          <img src={logoSvg} className={styles.logoImg} alt="Logo" />
          <img src={projectTextSvg} className={styles.projectNameSvg} alt="AVALON ROLE PLAY" />
        </div>

        {/* ПРАВЫЙ БЛОК: Сервер */}
        <div className={styles.serverContainer}>
          <div className={styles.serverBadge}>{serverIndex}</div>
          <span className={styles.serverNameText}>{serverName}</span>
        </div>

      </div>

      {/* СРЕДНЯЯ ПАНЕЛЬ */}
      <div className={styles.mainBar}>
        <div className={styles.indicatorsGroup}>
          
          {/* ЗДОРОВЬЕ */}
          <div className={`${styles.indicatorCircle} ${styles.healthCircle}`}>
            <div className={styles.circleBg} />
            <svg className={styles.circleProgress}>
              <circle cx="27" cy="27" r="25.5" strokeDasharray={circumference} strokeDashoffset={calculateOffset(health)} />
            </svg>
            <div className={styles.waveContainer}>
              <SmoothWave colorClass={styles.healthWave} />
            </div>
            <img src={heartSvg} className={styles.statusIcon} alt="" />
            <span className={styles.statusValue}>{health}</span>
          </div>

          {/* БРОНЯ */}
          <div className={`${styles.indicatorCircle} ${styles.armorCircle}`}>
            <div className={styles.circleBg} />
            <svg className={styles.circleProgress}>
              <circle cx="27" cy="27" r="25.5" strokeDasharray={circumference} strokeDashoffset={calculateOffset(armor)} />
            </svg>
            <div className={styles.waveContainer}>
              <SmoothWave colorClass={styles.armorWave} />
            </div>
            <img src={armorSvg} className={styles.statusIcon} alt="" />
            <span className={styles.statusValue}>{armor}</span>
          </div>

          {/* ГОЛОД */}
          <div className={`${styles.indicatorCircle} ${styles.hungerCircle}`}>
            <div className={styles.circleBg} />
            <svg className={styles.circleProgress}>
              <circle cx="27" cy="27" r="25.5" strokeDasharray={circumference} strokeDashoffset={calculateOffset(hunger)} />
            </svg>
            <div className={styles.waveContainer}>
              <SmoothWave colorClass={styles.hungerWave} />
            </div>
            <img src={burgerSvg} className={styles.statusIcon} alt="" />
            <span className={styles.statusValue}>{hunger}</span>
          </div>

        </div>

        <div className={styles.weaponZone} />
      </div>

      {/* НИЖНЯЯ ПАНЕЛЬ ДЕНЕГ С АНИМАЦИЕЙ ИЗМЕНЕНИЙ */}
      <div className={styles.footer} style={{ position: 'relative' }}>
        <img src={dollarSvg} className={styles.moneyIcon} alt="$" />
        <span className={styles.moneyText}>{formatMoney(money)} $</span>

        {/* Анимационный оверлей изменений */}
        {moneyChange !== null && changeType && (
          <div
            key={animationKey}
            className={`${styles.moneyChange} ${
              changeType === 'add' ? styles.moneyAdded : styles.moneySubbed
            }`}
          >
            {changeType === 'add' ? `+ ${formatMoney(moneyChange)} $` : `- ${formatMoney(moneyChange)} $`}
          </div>
        )}
      </div>

    </div>
  );
}