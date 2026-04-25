// Функции для работы с питомцем

function isSleeping() { return gameData.pet.sleepUntil && Date.now() < gameData.pet.sleepUntil; }
function isSick() { return gameData.pet.sickUntil && Date.now() < gameData.pet.sickUntil; }

// Вспомогательная функция для получения названия игры
function getGameName(type) {
    const names = { yarn: 'Клубок', ball: 'Мячик', laser: 'Лазер', candy: 'Фантик' };
    return names[type] || type;
}

// Проверка доступности игры по уровню
function isGameUnlocked(gameType) {
    const currentLevel = getCurrentLevel();
    return currentLevel.unlockGames.includes(gameType);
}

// Универсальная функция для проверки кулдауна (5 минут)
function checkCooldown(lastTimeKey) {
    const now = Date.now();
    const lastTime = gameData.pet[lastTimeKey] || 0;
    const cooldown = 5 * 60 * 1000;
    
    if (lastTime && (now - lastTime) < cooldown) {
        const remaining = Math.ceil((cooldown - (now - lastTime)) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return { canUse: false, remainingText: `${minutes}:${seconds.toString().padStart(2, '0')}` };
    }
    return { canUse: true, remainingText: null };
}

// Универсальная функция для проверки и использования бесплатных попыток
function useDailyLimit(actionKey, actionName, actionCost, cooldownKey) {
    const cooldown = checkCooldown(cooldownKey);
    if (!cooldown.canUse) {
        showMessage(`⏳ Подожди ${cooldown.remainingText} перед следующим "${actionName}"!`);
        return { success: false, cooldownText: cooldown.remainingText };
    }
    
    let count = gameData.pet[actionKey] || 0;
    const maxFree = 5;
    
    if (count < maxFree) {
        gameData.pet[actionKey] = count + 1;
        gameData.pet[cooldownKey] = Date.now();
        return { success: true, free: true };
    } else {
        if (gameData.gems >= actionCost) {
            gameData.gems -= actionCost;
            gameData.pet[cooldownKey] = Date.now();
            return { success: true, free: false, cost: actionCost };
        } else {
            showMessage(`💔 Нужно ${actionCost}💎 для "${actionName}"! Бесплатные попытки (5/5) закончились на сегодня.`);
            return { success: false, cooldownText: null };
        }
    }
}

// Обновление кнопки сна
function updateSleepButton() {
    const sleepBtn = document.getElementById('actionSleep');
    if (!sleepBtn) return;
    
    const sleeping = isSleeping();
    const sleepCount = gameData.pet.sleepCount || 0;
    
    if (sleeping) {
        sleepBtn.innerHTML = `
            <span class="action-emoji">🔔</span>
            <span class="action-name">Разбудить</span>
            <span class="action-price">30💎</span>
            <span class="action-limit">сейчас</span>
        `;
        const newBtn = sleepBtn.cloneNode(true);
        sleepBtn.parentNode.replaceChild(newBtn, sleepBtn);
        newBtn.id = 'actionSleep';
        newBtn.classList.remove('disabled');
        newBtn.addEventListener('click', forceWakeUp);
    } else {
        const lastTime = gameData.pet.sleepLastTime || 0;
        const cooldown = checkCooldown('sleepLastTime');
        const limitText = `${sleepCount}/5`;
        
        if (!cooldown.canUse && lastTime > 0) {
            sleepBtn.innerHTML = `
                <span class="action-emoji">⏳</span>
                <span class="action-name">Уложить спать</span>
                <span class="action-price">5💎</span>
                <span class="action-limit">${cooldown.remainingText}</span>
            `;
        } else {
            sleepBtn.innerHTML = `
                <span class="action-emoji">😴</span>
                <span class="action-name">Уложить спать</span>
                <span class="action-price">5💎</span>
                <span class="action-limit" id="sleepLimit">${limitText}</span>
            `;
        }
        const newBtn = sleepBtn.cloneNode(true);
        sleepBtn.parentNode.replaceChild(newBtn, sleepBtn);
        newBtn.id = 'actionSleep';
        if (!cooldown.canUse && lastTime > 0) {
            newBtn.classList.add('disabled');
        } else {
            newBtn.classList.remove('disabled');
        }
        newBtn.addEventListener('click', sleepCat);
    }
}

function wakeUpFromSleep() {
    if (gameData.pet.sleepUntil && Date.now() >= gameData.pet.sleepUntil) {
        gameData.pet.sleepUntil = null;
        gameData.pet.energy = Math.min(100, gameData.pet.energy + 50);
        saveGame();
        showMessage(`😸 ${gameData.petName} проснулась! +50% энергии`);
        playSound(880);
        updatePetBars();
        updateSleepButton();
    }
}

function checkAutoSleep() {
    if (isSleeping() || isSick()) return;
    
    if (gameData.pet.energy <= 15) {
        gameData.pet.sleepUntil = Date.now() + (15 * 60 * 1000);
        showEmotion('💤😴');
        showMessage(`😴 ${gameData.petName} очень устала и уснула! Нужно дать ей отдохнуть...`);
        playSound(500);
        saveGame();
        updatePetBars();
        updateActionLimitsDisplay();
        updateSleepButton();
        updateStatusTimers();
    }
}

function forceWakeUp() {
    if (!isSleeping()) { showMessage(`😸 ${gameData.petName} не спит!`); return; }
    if (gameData.gems >= 30) {
        gameData.gems -= 30;
        gameData.pet.sleepUntil = null;
        gameData.pet.happiness = Math.max(0, gameData.pet.happiness - 20);
        saveGame();
        showMessage(`🔔 Вы разбудили ${gameData.petName}! -30💎, счастье упало на 20%`);
        playSound(660);
        startConfetti();
        updatePetBars();
        updateGemsUI();
        updateSleepButton();
        updateActionLimitsDisplay();
        updateStatusTimers();
    } else {
        showMessage(`💔 Нужно 30💎 для пробуждения`);
    }
}

function recoverFromSickness() {
    if (gameData.pet.sickUntil && Date.now() >= gameData.pet.sickUntil) {
        gameData.pet.sickUntil = null;
        gameData.pet.hunger = 99;
        saveGame();
        showMessage(`😊 ${gameData.petName} поправилась! Сытость 99%`);
        playSound(880);
        updatePetBars();
    }
}

function cureFromMedicine() {
    if (gameData.pet.sickUntil) {
        gameData.pet.sickUntil = null;
        gameData.pet.hunger = 99;
        saveGame();
        showMessage(`💊 ${gameData.petName} поправилась! Сытость 99%`);
        playSound(880);
        updatePetBars();
    }
}

function feedPet() {
    if (isSleeping()) { showMessage(`😴 ${gameData.petName} спит! Не мешай ей`); return; }
    if (isSick()) { showMessage(`🤢 ${gameData.petName} болеет! Дай лекарство`); return; }
    
    const result = useDailyLimit('feedCount', 'Покормить', 5, 'feedLastTime');
    if (!result.success) return;
    
    let newHunger = gameData.pet.hunger + 35;
    gameData.pet.hunger = Math.min(110, newHunger);
    
    if (result.free) {
        showMessage(`🍗 ${gameData.petName} поела бесплатно! +35% сытости (${(gameData.pet.feedCount || 0)}/5 бесплатно)`);
    } else {
        showMessage(`🍗 ${gameData.petName} поела! -5💎, +35% сытости`);
    }
    
    if (newHunger > 100) {
        showEmotion('🍗🫠');
        showMessage(`🍗 ${gameData.petName} переела! Сытость ${Math.floor(newHunger)}%`);
        playSound(440);
        checkSickness();
    } else {
        showEmotion('🍗😋');
        playSound(880);
    }
    saveGame();
    updatePetBars();
    updateGemsUI();
    updateActionLimitsDisplay();
}

function giveMedicine() {
    if (!isSick()) { showMessage(`😊 ${gameData.petName} не болеет!`); return; }
    if (gameData.gems >= 50) {
        gameData.gems -= 50;
        cureFromMedicine();
        startConfetti();
        saveGame();
        updateStatusTimers();
        updateGemsUI();
        updatePetBars();
    } else showMessage(`💔 Нужно 50💎`);
}

function giveMilk() {
    if (isSleeping()) { showMessage(`😴 ${gameData.petName} спит!`); return; }
    if (isSick()) { showMessage(`🤢 ${gameData.petName} болеет! Нельзя молоко`); return; }
    
    const result = useDailyLimit('milkCount', 'Напоить', 5, 'milkLastTime');
    if (!result.success) return;
    
    let newHunger = gameData.pet.hunger + 15;
    gameData.pet.hunger = Math.min(110, newHunger);
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 10);
    
    if (result.free) {
        showMessage(`🥛 ${gameData.petName} выпила молоко бесплатно! +15% сыт, +10% счастья (${(gameData.pet.milkCount || 0)}/5 бесплатно)`);
    } else {
        showMessage(`🥛 ${gameData.petName} выпила молоко! -5💎, +15% сыт, +10% счастья`);
    }
    
    if (newHunger > 100) {
        showEmotion('🥛🫠');
        showMessage(`🥛 ${gameData.petName} переела от молока!`);
        playSound(440);
        checkSickness();
    } else {
        showEmotion('🥛😊');
        playSound(820);
    }
    saveGame();
    updatePetBars();
    updateGemsUI();
    updateActionLimitsDisplay();
}

function sleepCat() {
    if (isSleeping()) { showMessage(`😴 ${gameData.petName} уже спит!`); return; }
    
    const result = useDailyLimit('sleepCount', 'Уложить спать', 5, 'sleepLastTime');
    if (!result.success) return;
    
    gameData.pet.sleepUntil = Date.now() + (15 * 60 * 1000);
    
    if (result.free) {
        showMessage(`😴 ${gameData.petName} уснула бесплатно на 15 минут! (${(gameData.pet.sleepCount || 0)}/5 бесплатно)`);
    } else {
        showMessage(`😴 ${gameData.petName} уснула на 15 минут! -5💎`);
    }
    
    showEmotion('😴💤');
    playSound(500);
    saveGame();
    updatePetBars();
    updateGemsUI();
    updateActionLimitsDisplay();
    startConfetti();
    updateSleepButton();
}

function petCat() {
    if (isSleeping()) { showMessage(`😴 ${gameData.petName} спит!`); return; }
    
    const cooldown = checkCooldown('petLastTime');
    if (!cooldown.canUse && (gameData.pet.petLastTime || 0) > 0) {
        showMessage(`⏳ Подожди ${cooldown.remainingText} перед следующим "Погладить"!`);
        return;
    }
    
    const result = useDailyLimit('petCount', 'Погладить', 5, 'petLastTime');
    if (!result.success) return;
    
    showEmotion('✋❤️');
    
    if (result.free) {
        showMessage(`😊 ${gameData.petName} мурлычет от ласки! (${(gameData.pet.petCount || 0)}/5 бесплатно в день)`);
    } else {
        showMessage(`😊 ${gameData.petName} мурлычет! -5💎`);
    }
    
    playSound(660);
    saveGame();
    updateActionLimitsDisplay();
}

function playWithCat(type) {
    if (!isGameUnlocked(type)) {
        const currentLevel = getCurrentLevel();
        showMessage(`🔒 Игра "${getGameName(type)}" откроется на уровне "${currentLevel.name}"!`);
        return;
    }
    
    if (isSleeping()) { showMessage(`😴 ${gameData.petName} спит!`); return; }
    if (isSick()) { showMessage(`🤢 ${gameData.petName} болеет! Отдыхай`); return; }
    if (gameData.pet.energy < 15) { 
        checkAutoSleep();
        showEmotion('😴💤'); 
        showMessage(`😴 ${gameData.petName} слишком устала!`); 
        return; 
    }
    
    let actionKey = '', gameName = '', cooldownKey = '';
    if (type === 'yarn') { actionKey = 'playCount'; gameName = 'Клубок'; cooldownKey = 'playLastTime'; }
    else if (type === 'ball') { actionKey = 'playBallCount'; gameName = 'Мячик'; cooldownKey = 'playBallLastTime'; }
    else if (type === 'laser') { actionKey = 'playLaserCount'; gameName = 'Лазер'; cooldownKey = 'playLaserLastTime'; }
    else if (type === 'candy') { actionKey = 'playCandyCount'; gameName = 'Фантик'; cooldownKey = 'playCandyLastTime'; }
    
    const result = useDailyLimit(actionKey, gameName, 5, cooldownKey);
    if (!result.success) return;
    
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 20);
    gameData.pet.energy = Math.max(0, gameData.pet.energy - 12);
    
    let toys = { yarn: '🧶', ball: '⚽', laser: '🔴', candy: '🍬' };
    showEmotion(toys[type] + '🎉');
    
    if (result.free) {
        showMessage(`${toys[type]} Игра "${gameName}" бесплатно! +20% счастья (${(gameData.pet[actionKey] || 0)}/5)`);
    } else {
        showMessage(`${toys[type]} Игра "${gameName}"! -5💎, +20% счастья`);
    }
    
    playSound(880);
    startConfetti();
    saveGame();
    updatePetBars();
    updateGemsUI();
    updateActionLimitsDisplay();
    updateSleepButton();
    
    if (gameData.pet.energy <= 15) {
        checkAutoSleep();
    }
}

function brushCat() {
    if (isSleeping()) { showMessage(`😴 ${gameData.petName} спит!`); return; }
    
    const result = useDailyLimit('brushCount', 'Расчесать', 5, 'brushLastTime');
    if (!result.success) return;
    
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 10);
    gameData.pet.clean = Math.min(100, gameData.pet.clean + 10);
    showEmotion('🪮✨');
    
    if (result.free) {
        showMessage(`🪮 Расчёска бесплатно! +10% чистоты, +10% счастья (${(gameData.pet.brushCount || 0)}/5)`);
    } else {
        showMessage(`🪮 Расчёска! -5💎, +10% чистоты, +10% счастья`);
    }
    
    playSound(740);
    saveGame();
    updatePetBars();
    updateGemsUI();
    updateActionLimitsDisplay();
}

function batheCat() {
    if (isSleeping()) { showMessage(`😴 ${gameData.petName} спит!`); return; }
    
    const result = useDailyLimit('batheCount', 'Искупать', 5, 'batheLastTime');
    if (!result.success) return;
    
    gameData.pet.clean = Math.min(100, gameData.pet.clean + 30);
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 5);
    showEmotion('🛁✨');
    
    if (result.free) {
        showMessage(`🛁 Купание бесплатно! +30% чистоты, +5% счастья (${(gameData.pet.batheCount || 0)}/5)`);
    } else {
        showMessage(`🛁 Купание! -5💎, +30% чистоты, +5% счастья`);
    }
    
    playSound(780);
    startConfetti();
    saveGame();
    updatePetBars();
    updateGemsUI();
    updateActionLimitsDisplay();
}

function giveGift() {
    if (isSleeping()) { showMessage(`😴 ${gameData.petName} спит!`); return; }
    
    const result = useDailyLimit('giftCount', 'Подарок', 5, 'giftLastTime');
    if (!result.success) return;
    
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 40);
    showEmotion('🎁😻');
    
    if (result.free) {
        showMessage(`🎁 Подарок бесплатно! +40% счастья (${(gameData.pet.giftCount || 0)}/5)`);
    } else {
        showMessage(`🎁 Подарок! -5💎, +40% счастья`);
    }
    
    playSound(1000);
    startConfetti();
    saveGame();
    updatePetBars();
    updateGemsUI();
    updateActionLimitsDisplay();
}

function cleanLitterBox() {
    if (isSleeping()) { showMessage(`😴 ${gameData.petName} спит! Не мешай ей`); return; }
    if (isSick()) { showMessage(`🤢 ${gameData.petName} болеет! Нельзя убирать сейчас`); return; }
    
    const result = useDailyLimit('litterCount', 'Убрать лоток', 5, 'litterLastTime');
    if (!result.success) return;
    
    gameData.pet.lastCleaned = Date.now();
    gameData.pet.needsLitter = 0;
    gameData.pet.clean = Math.min(100, gameData.pet.clean + 15);
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 5);
    showEmotion('🧹✨');
    
    if (result.free) {
        showMessage(`🧹 Лоток убран бесплатно! +15% чистоты, +5% счастья (${(gameData.pet.litterCount || 0)}/5)`);
    } else {
        showMessage(`🧹 Лоток убран! -5💎, +15% чистоты, +5% счастья`);
    }
    
    playSound(820);
    saveGame();
    updatePetBars();
    updateGemsUI();
    renderLitterButton();
}

function resetDailyLimits() {
    gameData.pet.feedCount = 0;
    gameData.pet.milkCount = 0;
    gameData.pet.sleepCount = 0;
    gameData.pet.petCount = 0;
    gameData.pet.playCount = 0;
    gameData.pet.playBallCount = 0;
    gameData.pet.playLaserCount = 0;
    gameData.pet.playCandyCount = 0;
    gameData.pet.brushCount = 0;
    gameData.pet.batheCount = 0;
    gameData.pet.giftCount = 0;
    gameData.pet.litterCount = 0;
    
    gameData.pet.feedLastTime = 0;
    gameData.pet.milkLastTime = 0;
    gameData.pet.sleepLastTime = 0;
    gameData.pet.petLastTime = 0;
    gameData.pet.playLastTime = 0;
    gameData.pet.playBallLastTime = 0;
    gameData.pet.playLaserLastTime = 0;
    gameData.pet.playCandyLastTime = 0;
    gameData.pet.brushLastTime = 0;
    gameData.pet.batheLastTime = 0;
    gameData.pet.giftLastTime = 0;
    gameData.pet.litterLastTime = 0;
    
    saveGame();
    updateActionLimitsDisplay();
    updateSleepButton();
}

function checkSickness() {
    if (gameData.pet.hunger > 100 && !gameData.pet.sickUntil && !isSick()) {
        gameData.pet.sickUntil = Date.now() + (2 * 60 * 60 * 1000);
        gameData.pet.happiness = 0;
        showEmotion('🤢💔');
        showMessage(`🤢 ${gameData.petName} переела! Счастье = 0. Поправится через 2 часа или лекарство 50💎`);
        playSound(440);
        saveGame();
        updatePetBars();
    }
}