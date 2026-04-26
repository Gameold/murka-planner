// ============================================
// 1. ЦЕНЫ ЗА ДЕЙСТВИЯ (когда бесплатные попытки кончились)
// ============================================
const ACTION_PRICES = {
    // Обычные действия (цена в алмазах)
    feed: 3,          // 🍗 Покормить - цена после лимита
    milk: 3,          // 🥛 Напоить - цена после лимита
    sleep: 5,         // 😴 Уложить спать - цена после лимита
    wakeup: 30,       // 🔔 Разбудить (внезапно) - цена
    medicine: 50,     // 💊 Лекарство от болезни
    pet: 2,           // ✋ Погладить - цена после лимита
    
    // Игры (цена после лимита)
    play: {
        yarn: 4,      // 🧶 Клубок
        ball: 4,      // ⚽ Мячик
        laser: 4,     // 🔴 Лазер
        candy: 4      // 🍬 Фантик
    },
    
    // Уход за питомцем
    brush: 3,         // 🪮 Расчесать
    bathe: 4,         // 🛁 Искупать
    gift: 12,         // 🎁 Подарок (дорогой, даёт много счастья)
    litter: 3         // 🚽 Убрать лоток
};

// ============================================
// 2. БЕСПЛАТНЫЕ ЛИМИТЫ (сколько раз можно сделать БЕСПЛАТНО в день)
// ============================================
const FREE_LIMITS = {
    // --------------------------------------------------
    // 2.1 Количество бесплатных действий в день
    // --------------------------------------------------
    feedFreePerDay: 5,      // 🍗 Покормить - сколько раз бесплатно
    milkFreePerDay: 5,      // 🥛 Напоить - сколько раз бесплатно
    sleepFreePerDay: 3,     // 😴 Уложить спать - сон важен, поэтому мало бесплатных
    petFreePerDay: 8,       // ✋ Погладить - можно много раз, приятно и полезно
    playFreePerDay: 4,      // 🎮 Игры - 4 раза бесплатно, дальше за кристаллы
    brushFreePerDay: 5,     // 🪮 Расчесать
    batheFreePerDay: 3,     // 🛁 Искупать - купание редко, поэтому мало
    giftFreePerDay: 0,      // 🎁 Подарок - НИ РАЗУ БЕСПЛАТНО! Всегда за кристаллы
    litterFreePerDay: 6,    // 🚽 Убрать лоток - часто нужно, много бесплатных
    
    // --------------------------------------------------
    // 2.2 КУЛДАУНЫ (время ожидания между действиями в МИНУТАХ)
    // --------------------------------------------------
    feedCooldown: 5,        // 🍗 После кормления ждать 5 минут
    milkCooldown: 5,        // 🥛 После молока ждать 5 минут
    sleepCooldown: 5,       // 😴 После сна ждать 5 минут (нельзя уснуть сразу)
    petCooldown: 3,         // ✋ Погладить можно чаще - всего 3 минуты
    playCooldown: 5,        // 🎮 После игры ждать 5 минут
    brushCooldown: 5,       // 🪮 Расчёсывать раз в 5 минут
    batheCooldown: 10,      // 🛁 Купание - долгое ожидание 10 минут
    giftCooldown: 15,       // 🎁 Подарок - очень редко, ждать 15 минут
    litterCooldown: 5       // 🚽 Уборка лотка - 5 минут
};

// ============================================
// 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (НЕ ТРОГАТЬ!)
// ============================================
// Они берут значения из настроек выше и передают в игру
// ============================================

// Получить цену действия (в алмазах)
function getActionPrice(action, subAction = null) {
    if (subAction && ACTION_PRICES[action] && ACTION_PRICES[action][subAction]) {
        return ACTION_PRICES[action][subAction];
    }
    return ACTION_PRICES[action] || 5;
}

// Получить цену в виде текста для кнопки (например "3💎")
function getPriceText(action, subAction = null) {
    const price = getActionPrice(action, subAction);
    if (price === 0) return 'беспл';
    return `${price}💎`;
}

// Получить количество бесплатных попыток для конкретного действия
function getMaxFreePerDay(actionKey) {
    const limitKey = `${actionKey}FreePerDay`;
    if (FREE_LIMITS[limitKey] !== undefined) {
        return FREE_LIMITS[limitKey];
    }
    return 5; // значение по умолчанию
}

// Получить время кулдауна в минутах
function getCooldownMinutes(action) {
    const cooldownKey = `${action}Cooldown`;
    if (FREE_LIMITS[cooldownKey] !== undefined) {
        return FREE_LIMITS[cooldownKey];
    }
    return 5; // значение по умолчанию
}

// Получить лимит по ключу из gameData.pet (используется внутри игры)
function getFreeLimitForAction(actionKey) {
    const limitsMap = {
        feedCount: 'feedFreePerDay',
        milkCount: 'milkFreePerDay',
        sleepCount: 'sleepFreePerDay',
        petCount: 'petFreePerDay',
        playCount: 'playFreePerDay',
        playBallCount: 'playFreePerDay',
        playLaserCount: 'playFreePerDay',
        playCandyCount: 'playFreePerDay',
        brushCount: 'brushFreePerDay',
        batheCount: 'batheFreePerDay',
        giftCount: 'giftFreePerDay',
        litterCount: 'litterFreePerDay'
    };
    const limitKey = limitsMap[actionKey];
    if (FREE_LIMITS[limitKey] !== undefined) {
        return FREE_LIMITS[limitKey];
    }
    return 5;
}