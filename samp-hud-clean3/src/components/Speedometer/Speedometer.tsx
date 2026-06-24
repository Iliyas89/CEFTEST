import React from 'react';
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

interface SpeedometerProps {
  speed: number;
  fuel: number;
  mileage: number;
  hp: number;
  turnLeft: boolean;
  lights: boolean;
  engine: boolean;
  parking: boolean;
  locked: boolean;
  turnRight: boolean;
}

export const Speedometer: React.FC<SpeedometerProps> = ({
  speed = 0,
  fuel = 100,
  mileage = 0,
  hp = 100,
  turnLeft = false,
  lights = false,
  engine = false,
  parking = false,
  locked = false,
  turnRight = false
}) => {
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