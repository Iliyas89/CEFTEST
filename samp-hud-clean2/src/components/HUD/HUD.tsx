import { useState, useEffect } from 'react';
import styles from './HUD.module.css';

import userSvg from './assets/user.svg';
import logoSvg from './assets/logo.svg';
import projectTextSvg from './assets/project_text.svg';
import heartSvg from './assets/heart.svg';
import armorSvg from './assets/armor.svg';
import burgerSvg from './assets/burger.svg';
import dollarSvg from './assets/dollar.svg';

interface HudProps {
  health?: number;
  armor?: number;
  hunger?: number;
  money?: number;
  playerId?: number;
  serverIndex?: number;
  serverName?: string;
  online?: number;
}

const calculateOffset = (value: number) => {
  const radius = 25.5;
  const circumference = 2 * Math.PI * radius;
  return circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
};

const formatMoney = (amount: number) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export default function HUD(props: HudProps) {
  const [prevMoney, setPrevMoney] = useState<number>(props.money ?? 0);
  const [moneyChange, setMoneyChange] = useState<number | null>(null);
  const [changeType, setChangeType] = useState<'add' | 'sub' | null>(null);
  const [animationKey, setAnimationKey] = useState<number>(0);

  // Анимация изменения денег
  useEffect(() => {
    const currentMoney = props.money ?? 0;
    if (currentMoney !== prevMoney) {
      const diff = currentMoney - prevMoney;
      setMoneyChange(Math.abs(diff));
      setChangeType(diff > 0 ? 'add' : 'sub');
      setAnimationKey(prev => prev + 1);
      setPrevMoney(currentMoney);
      const timer = setTimeout(() => {
        setMoneyChange(null);
        setChangeType(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [props.money, prevMoney]);

  const circumference = 2 * Math.PI * 25.5;

  // Изменили координаты пути C, чтобы поднять волны повыше (примерно до 45-50% круга)
  const SmoothWave = ({ colorClass }: { colorClass: string }) => (
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`${styles.smoothWaveSvg} ${colorClass}`}>
    {/* Поменяли 48/38/58 на 55/45/65, чтобы опустить верхнюю точку ровно до 45% высоты круга */}
    <path d="M0,55 C30,45 70,65 100,55 L100,100 L0,100 Z" />
  </svg>
);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.userContainer}>
          <div className={styles.onlineRow}>
            <img src={userSvg} className={styles.userIcon} alt="" />
            <span className={styles.onlineText}>{props.online ?? 1} / 1000</span>
          </div>
          <span className={styles.userIdText}>ID {props.playerId ?? 0}</span>
        </div>
        <div className={styles.brandRow}>
          <img src={logoSvg} className={styles.logoImg} alt="Logo" />
          <img src={projectTextSvg} className={styles.projectNameSvg} alt="AVALON ROLE PLAY" />
        </div>
        <div className={styles.serverContainer}>
          <div className={styles.serverBadge}>{props.serverIndex ?? 1}</div>
          <span className={styles.serverNameText}>{props.serverName ?? "AVALON"}</span>
        </div>
      </div>

      <div className={styles.mainBar}>
        <div className={styles.indicatorsGroup}>
          {/* Здоровье */}
          <div className={`${styles.indicatorCircle} ${styles.healthCircle}`}>
            <div className={styles.circleBg} />
            <svg className={styles.circleProgress}>
              <circle cx="27" cy="27" r="25.5" strokeDasharray={circumference} strokeDashoffset={calculateOffset(props.health ?? 100)} />
            </svg>
            <div className={styles.waveContainer}>
              <SmoothWave colorClass={styles.healthWave} />
            </div>
            <img src={heartSvg} className={styles.statusIcon} alt="" />
            <span className={styles.statusValue}>{props.health ?? 100}</span>
          </div>
          {/* Броня */}
          <div className={`${styles.indicatorCircle} ${styles.armorCircle}`}>
            <div className={styles.circleBg} />
            <svg className={styles.circleProgress}>
              <circle cx="27" cy="27" r="25.5" strokeDasharray={circumference} strokeDashoffset={calculateOffset(props.armor ?? 0)} />
            </svg>
            <div className={styles.waveContainer}>
              <SmoothWave colorClass={styles.armorWave} />
            </div>
            <img src={armorSvg} className={styles.statusIcon} alt="" />
            <span className={styles.statusValue}>{props.armor ?? 0}</span>
          </div>
          {/* Голод */}
          <div className={`${styles.indicatorCircle} ${styles.hungerCircle}`}>
            <div className={styles.circleBg} />
            <svg className={styles.circleProgress}>
              <circle cx="27" cy="27" r="25.5" strokeDasharray={circumference} strokeDashoffset={calculateOffset(props.hunger ?? 100)} />
            </svg>
            <div className={styles.waveContainer}>
              <SmoothWave colorClass={styles.hungerWave} />
            </div>
            <img src={burgerSvg} className={styles.statusIcon} alt="" />
            <span className={styles.statusValue}>{props.hunger ?? 100}</span>
          </div>
        </div>
        <div className={styles.weaponZone} />
      </div>

      <div className={styles.footer}>
        <img src={dollarSvg} className={styles.moneyIcon} alt="$" />
        {/* Убрали знак доллара из текстовой строки */}
        <span className={styles.moneyText}>{formatMoney(props.money ?? 0)}</span>
        {moneyChange !== null && changeType && (
          <div key={animationKey} className={`${styles.moneyChange} ${changeType === 'add' ? styles.moneyAdded : styles.moneySubbed}`}>
            {/* Убрали знаки доллара из всплывающих анимаций */}
            {changeType === 'add' ? `+ ${formatMoney(moneyChange)}` : `- ${formatMoney(moneyChange)}`}
          </div>
        )}
      </div>
    </div>
  );
}