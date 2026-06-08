import React, { useState, useEffect } from 'react';
import styles from './Inventory.module.css';

interface Item {
    id: number;
    item_id: number;
    name: string;
    count: number;
    daysLeft?: number;
}

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    slotIndex: number;
    item: Item;
}

const Inventory: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('accessories');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [inventorySlots, setInventorySlots] = useState<(Item | null)[]>(Array(40).fill(null));
    
    // Индекс выбранного для перемещения предмета
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
    
    // Состояние контекстного меню
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const [equipment, setEquipment] = useState<{
        hat: Item | null;
        glasses: Item | null;
        pendant: Item | null;
        mask: Item | null;
        suit: Item | null;
        backpack: Item | null;
        armor: Item | null;
    }>({
        hat: null, glasses: null, pendant: null, mask: null, suit: null, backpack: null, armor: null,
    });

    useEffect(() => {
        if (!(window as any).cef) {
            const mockGrid: (Item | null)[] = Array(40).fill(null);
            mockGrid[0] = { id: 10, item_id: 1234, name: "Bitcoin", count: 1 };
            mockGrid[1] = { id: 11, item_id: 8, name: "Маска кота", count: 1, daysLeft: 29 };
            mockGrid[11] = { id: 12, item_id: 348, name: "Desert Eagle", count: 1 };
            mockGrid[15] = { id: 13, item_id: 777, name: "Лотерейный билет", count: 10 };
            setInventorySlots(mockGrid);

            setEquipment({
                hat: { id: 1, item_id: 111, name: "Ведьминская шляпа", count: 1 },
                glasses: null, pendant: null, mask: null,
                suit: { id: 2, item_id: 222, name: "Скин Фрирен", count: 1 },
                backpack: null, armor: null,
            });
        }

        // Закрытие меню при клике в любое свободное место
        const handleOutsideClick = () => setContextMenu(null);
        window.addEventListener('click', handleOutsideClick);

        return () => {
            window.removeEventListener('click', handleOutsideClick);
        };
    }, []);

    const sendToServer = (eventName: string, data: any = {}) => {
        if ((window as any).cef) {
            (window as any).cef.emit(eventName, JSON.stringify(data));
        } else {
            console.log(`[DEV-PAWN-EMIT] Событие: ${eventName}`, data);
        }
    };

    // Обработка клика по слоту инвентаря
    const handleSlotClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation(); // Чтобы не срабатывал клик по бэкграунду
        const item = inventorySlots[index];

        // 1. Если кликнули на тот же самый слот, который уже выбран и меню открыто — закрываем всё
        if (selectedSlotIndex === index) {
            setSelectedSlotIndex(null);
            setContextMenu(null);
            return;
        }

        // 2. Если уже был выбран предмет для переноса (в другом слоте)
        if (selectedSlotIndex !== null) {
            // Перенос или обмен местами
            const updatedSlots = [...inventorySlots];
            const temp = updatedSlots[index];
            updatedSlots[index] = updatedSlots[selectedSlotIndex];
            updatedSlots[selectedSlotIndex] = temp;
            
            setInventorySlots(updatedSlots);
            sendToServer("onMoveItem", { from: selectedSlotIndex, to: index });
            
            setSelectedSlotIndex(null);
            setContextMenu(null);
            return;
        }

        // 3. Если слот не пустой, открываем контекстное меню
        if (item) {
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                slotIndex: index,
                item: item
            });
            setSelectedSlotIndex(index); // Помечаем как готовый к переносу
        }
    };

    // Действия из контекстного меню
    const handleAction = (actionName: string) => {
        if (!contextMenu) return;
        
        sendToServer("onItemAction", { 
            action: actionName, 
            slotIndex: contextMenu.slotIndex, 
            item: contextMenu.item 
        });

        // Пример локального удаления для теста кнопки "ВЫБРОСИТЬ"
        if (actionName === 'drop' && !(window as any).cef) {
            const updatedSlots = [...inventorySlots];
            updatedSlots[contextMenu.slotIndex] = null;
            setInventorySlots(updatedSlots);
        }

        setContextMenu(null);
        setSelectedSlotIndex(null);
    };

    return (
        <div className={styles.mainWrapper}>
            
            {/* ЛЕВАЯ ЧАСТЬ: ПЕРСОНАЖ И МЕНЮ */}
            <div className={styles.leftPanel}>
                <div className={styles.panelTitle}>ПЕРСОНАЖ</div>
                
                <div className={styles.characterZone}>
                    <div className={styles.equipColumn}>
                        <div className={styles.equipSlot} onClick={() => sendToServer("onEquipSlotClick", { slot: "hat" })}>
                            {equipment.hat?.item_id && <img src={`/assets/items/${equipment.hat.item_id}.png`} alt="" />}
                        </div>
                        <div className={styles.equipSlot} onClick={() => sendToServer("onEquipSlotClick", { slot: "glasses" })}>
                            {equipment.glasses?.item_id && <img src={`/assets/items/${equipment.glasses.item_id}.png`} alt="" />}
                        </div>
                        <div className={styles.equipSlot} onClick={() => sendToServer("onEquipSlotClick", { slot: "pendant" })}>
                            {equipment.pendant?.item_id && <img src={`/assets/items/${equipment.pendant.item_id}.png`} alt="" />}
                        </div>
                    </div>

                    <div className={styles.characterRender}>
                        <img src="/assets/skin_preview.png" alt="Character" className={styles.skinImg} />
                    </div>

                    <div className={styles.equipColumn}>
                        <div className={styles.equipSlot} onClick={() => sendToServer("onEquipSlotClick", { slot: "mask" })}>
                            {equipment.mask?.item_id && <img src={`/assets/items/${equipment.mask.item_id}.png`} alt="" />}
                        </div>
                        <div className={styles.equipSlot} onClick={() => sendToServer("onEquipSlotClick", { slot: "suit" })}>
                            {equipment.suit?.item_id && <img src={`/assets/items/${equipment.suit.item_id}.png`} alt="" />}
                        </div>
                        <div className={styles.equipSlot} onClick={() => sendToServer("onEquipSlotClick", { slot: "backpack" })}>
                            {equipment.backpack?.item_id && <img src={`/assets/items/${equipment.backpack.item_id}.png`} alt="" />}
                        </div>
                    </div>
                </div>

                <div className={styles.armorRow}>
                    <div className={styles.equipSlot} onClick={() => sendToServer("onEquipSlotClick", { slot: "armor" })}>
                        {equipment.armor?.item_id && <img src={`/assets/items/${equipment.armor.item_id}.png`} alt="" />}
                    </div>
                </div>

                <div className={styles.tabsContainer}>
                    <button className={`${styles.tabBtn} ${activeTab === 'accessories' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('accessories'); sendToServer("onTabChange", { tab: "accessories" }); }}>АКСЕССУАРЫ</button>
                    <button className={`${styles.tabBtn} ${activeTab === 'docs' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('docs'); sendToServer("onTabChange", { tab: "docs" }); }}>ДОКУМЕНТЫ</button>
                    <button className={`${styles.tabBtn} ${activeTab === 'upgrades' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('upgrades'); sendToServer("onTabChange", { tab: "upgrades" }); }}>УЛУЧШЕНИЯ</button>
                </div>

                <div className={styles.navigationMenu}>
                    {['ДОМ', 'БИЗНЕС', 'СЕМЬЯ', 'ДОНАТ', 'КВЕСТЫ', 'ДОСТИЖЕНИЯ', 'НАСТРОЙКИ'].map((name, i) => (
                        <button key={i} className={styles.menuBtn} onClick={() => sendToServer("onMenuBtnClick", { button: name })}>
                            {name}
                        </button>
                    ))}
                </div>

                <div className={styles.bottomSystemRow}>
                    <button className={styles.systemBtn} onClick={() => sendToServer("onHelpClick")}>ПОМОЩЬ</button>
                    <button className={styles.systemBtn} onClick={() => sendToServer("onStorageClick")}>ХРАНИЛИЩЕ</button>
                    <button className={styles.systemBtn} onClick={() => sendToServer("onGpsClick")}>GPS</button>
                </div>
            </div>

            {/* ПРАВАЯ ЧАСТЬ: ИНВЕНТАРЬ (СЕТКА) */}
            <div className={styles.rightPanel}>
                <div className={styles.rightHeader}>
                    <div className={styles.panelTitle}>ИНВЕНТАРЬ</div>
                    <div className={styles.headerControls}>
                        <button className={styles.controlBtn} onClick={() => sendToServer("onInfoClick")}>INFO</button>
                        <button className={styles.controlBtn} onClick={() => sendToServer("onServerRefresh")}>REFRESH</button>
                        <button className={`${styles.controlBtn} ${styles.closeBtn}`} onClick={() => sendToServer("onCloseInventory")}>✕</button>
                    </div>
                </div>

                <div className={styles.searchWrapper}>
                    <input 
                        type="text" 
                        placeholder="ПОИСК" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.inventoryGrid}>
                    {inventorySlots.map((item, index) => {
                        if (searchQuery && item && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                            return <div key={index} className={styles.gridSlot} />;
                        }

                        const isSelected = selectedSlotIndex === index;

                        return (
                            <div 
                                key={index} 
                                className={`${styles.gridSlot} ${isSelected ? styles.selectedSlot : ''}`} 
                                onClick={(e) => handleSlotClick(e, index)}
                            >
                                {item?.item_id ? (
                                    <div className={styles.itemContainer}>
                                        <img src={`/assets/items/${item.item_id}.png`} alt={item.name} className={styles.itemImg} />
                                        {item.count > 1 && <span className={styles.itemCount}>{item.count}</span>}
                                        {item.daysLeft && <span className={styles.itemTimer}>{item.daysLeft} дней</span>}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ДИНАМИЧЕСКОЕ КОНТЕКСТНОЕ МЕНЮ */}
            {contextMenu?.visible && (
                <div 
                    className={styles.contextMenu} 
                    style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.contextTitle}>{contextMenu.item.name}</div>
                    <button onClick={() => handleAction('use')}>ИСПОЛЬЗОВАТЬ</button>
                    <button onClick={() => handleAction('split')}>РАЗДЕЛИТЬ</button>
                    <button onClick={() => handleAction('info')}>ИНФО</button>
                    <button className={styles.contextDropBtn} onClick={() => handleAction('drop')}>ВЫБРОСИТЬ</button>
                </div>
            )}

        </div>
    );
};

export default Inventory;