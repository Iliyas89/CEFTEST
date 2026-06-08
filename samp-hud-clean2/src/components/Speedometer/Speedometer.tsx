import React, { useState, useEffect } from 'react';
import styles from './Speedometer.module.css';

// Импорт SVG-иконок
import arrowLeft from './assets/arrow_left.svg';
import arrowRight from './assets/arrow_right.svg';
import carTop from './assets/car_top.svg';
import engineIcon from './assets/engine.svg';
import fuelIcon from './assets/fuel.svg';
import headlightIcon from './assets/headlight.svg';
import keyIcon from './assets/key.svg';
import parkingIcon from './assets/parking.svg';

export const Speedometer: React.FC = () => {
  // Динамические состояния интерфейса
  const [speed, setSpeed] = useState<number>(0);
  const [fuel, setFuel] = useState<number>(100);
  const [mileage, setMileage] = useState<number>(0);
  const [hp, setHp] = useState<number>(100);
  
  // Состояния для иконок панелей
  const [turnLeft, setTurnLeft] = useState<boolean>(false);
  const [lights, setLights] = useState<boolean>(false);
  const [engine, setEngine] = useState<boolean>(false);
  const [parking, setParking] = useState<boolean>(false);
  const [locked, setLocked] = useState<boolean>(false);
  const [turnRight, setTurnRight] = useState<boolean>(false);

  useEffect(() => {
    // ГЛОБАЛЬНЫЙ ПРИЁМНИК ДЛЯ ИГРЫ И СЕРВЕРА
    const handleGameUpdate = (dataJson: string) => {
      try {
        const data = JSON.parse(dataJson);
        
        if (data.speed !== undefined) setSpeed(data.speed);
        if (data.fuel !== undefined) setFuel(data.fuel);
        if (data.mileage !== undefined) setMileage(data.mileage);
        if (data.hp !== undefined) setHp(data.hp);
        if (data.engine !== undefined) setEngine(data.engine);
        if (data.lights !== undefined) setLights(data.lights);
        if (data.parking !== undefined) setParking(data.parking);
        if (data.locked !== undefined) setLocked(data.locked);
        if (data.turnLeft !== undefined) setTurnLeft(data.turnLeft);
        if (data.turnRight !== undefined) setTurnRight(data.turnRight);
      } catch (error) {
        console.error("Ошибка при разборе данных из игры:", error);
      }
    };

    // Регистрируем функцию в window
    (window as any).updateSpeedometer = handleGameUpdate;

    // ПРОВЕРКА: Если мы в обычном браузере, запускаем ОЧЕРЕДЬ ТЕСТОВ
    const isRunningInGame = (window as any).mp !== undefined || (window as any).cef !== undefined;
    
    let mainInterval: any = null;
    let iconCounter = 0; // Счетчик для переключения иконок по очереди

    if (!isRunningInGame) {
      console.log("[Speedometer] Включен поочередный симулятор (2 сек на иконку).");
      
      mainInterval = setInterval(() => {
        // 1. Плавное изменение цифр (чтобы они не стояли на месте)
        setSpeed(Math.floor(Math.random() * 40) + 80); // скорость в районе 80-120 км/ч
        setFuel(prev => (prev > 10 ? prev - 1 : 100));
        setMileage(prev => prev + 1);
        setHp(Math.floor(Math.random() * 6) + 95);    // ХП машины гуляет 95-100%

        // 2. Логика поочередного включения иконок (каждые 2 секунды)
        setTurnLeft(false);
        setLights(false);
        setEngine(false);
        setParking(false);
        setLocked(false);
        setTurnRight(false);

        // Включаем строго одну иконку в зависимости от шага счетчика
        switch (iconCounter) {
          case 0:
            setTurnLeft(true);
            break;
          case 1:
            setLights(true); // Загорится ровным синим светом
            break;
          case 2:
            setEngine(true); // Загорится зеленым
            break;
          case 3:
            setParking(true);
            break;
          case 4:
            setLocked(true);
            break;
          case 5:
            setTurnRight(true);
            break;
        }

        // Переходим к следующей иконке (всего 6 состояний от 0 до 5)
        iconCounter = (iconCounter + 1) % 6;

      }, 2000); // Интервал ровно 2 секунды
    }

    return () => {
      (window as any).updateSpeedometer = null;
      if (mainInterval) clearInterval(mainInterval);
    };
  }, []);

  const currentSpeed = Math.min(Math.max(speed, 0), 300);

  return (
    <div className={styles.wrapper}>
      
      {/* ЛЕВАЯ ЧАСТЬ: Цифровой спидометр, бензин, одометр */}
      <div className={styles.mainInfoBlock}>
        
        <div className={styles.fuelRow}>
          <img src={fuelIcon} alt="Fuel" className={styles.fuelIcon} />
          <span className={styles.fuelText}>{fuel}%</span>
        </div>

        <div className={styles.speedFlexContainer}>
          <h1 className={styles.speedValue}>{currentSpeed}</h1>
          <span className={styles.kmhLabel}>km/h</span>
        </div>

        <div className={styles.odom}>
          {String(mileage).padStart(6, '0')} KM
        </div>

      </div>

      {/* ПРАВАЯ ЧАСТЬ: Машина и проценты ХП */}
      <div className={styles.carSection}>
        <img src={carTop} alt="Vehicle" className={styles.carUiImg} />
        <div className={styles.carHpText}>{hp}%</div>
      </div>

      {/* НИЖНЯЯ ПАНЕЛЬ ИКОНОК */}
      <div className={styles.bottomBar}>
        <div className={styles.innerIcons}>
          
          <div className={`${styles.iconCircle} ${turnLeft ? styles.activeOrange : ''}`}>
            <img src={arrowLeft} alt="<" />
          </div>
          
          {/* ФАРЫ: Теперь просто горят стабильным синим светом (без мигания) */}
          <div className={`${styles.iconCircle} ${lights ? styles.activeBlue : ''}`}>
            <img src={headlightIcon} alt="Lights" />
          </div>
          
          <div className={`${styles.iconCircle} ${engine ? styles.activeGreen : styles.activeRed}`}>
            <img src={engineIcon} alt="Engine" />
          </div>
          
          <div className={`${styles.iconCircle} ${parking ? styles.activeRed : ''}`}>
            <img src={parkingIcon} alt="P" />
          </div>
          
          <div className={`${styles.iconCircle} ${locked ? styles.activeOrange : ''}`}>
            <img src={keyIcon} alt="Lock" />
          </div>
          
          <div className={`${styles.iconCircle} ${turnRight ? styles.activeOrange : ''}`}>
            <img src={arrowRight} alt=">" />
          </div>

        </div>
      </div>

    </div>
  );
};

export default Speedometer;