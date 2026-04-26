function isSleeping() {
    return gameData.pet.sleepUntil && Date.now() < gameData.pet.sleepUntil;
}

function isSick() {
    return gameData.pet.sickUntil && Date.now() < gameData.pet.sickUntil;
}

function getGameName(type) {
    const names = { yarn: 'Клубок', ball: 'Мячик', laser: 'Лазер', candy: 'Фантик' };
    return names[type] || type;
}

function checkCooldown(lastTimeKey) {
    const now = Date.now();
    const lastTime = gameData.pet[lastTimeKey] || 0;
    
    if (lastTime && (now - lastTime) < CONFIG.COOLDOWN_MS) {
        const remaining = Math.ceil((CONFIG.COOLDOWN_MS - (now - lastTime)) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return { canUse: false, remainingText: `${minutes}:${seconds.toString().padStart(2, '0')}` };
    }
    return { canUse: true, remainingText: null };
}

function useDailyLimit(actionKey, actionName, actionCost, cooldownKey) {
    const cooldown = checkCooldown(cooldownKey);
    if (!cooldown.canUse) {
        showMessage(`⏳ Подожди ${cooldown.remainingText} перед следующим "${actionName}"!`);
        return { success: false, cooldownText: cooldown.remainingText };
    }
    
    let count = gameData.pet[actionKey] || 0;
    const maxFree = getFreeLimitForAction(actionKey);
    
    if (count < maxFree) {
        gameData.pet[actionKey] = count + 1;
        gameData.pet[cooldownKey] = Date.now();
        return { success: true, free: true, remainingFree: maxFree - count - 1 };
    } else {
        if (gameData.gems >= actionCost) {
            const confirmed = confirm(`💎 ВНИМАНИЕ! 💎\n\nБесплатные попытки на сегодня закончились.\nТы хочешь потратить ${actionCost}💎 на "${actionName}"?\n\nНа счету: ${gameData.gems}💎`);
            
            if (confirmed) {
                gameData.gems -= actionCost;
                gameData.pet[cooldownKey] = Date.now();
                return { success: true, free: false, cost: actionCost };
            } else {
                showMessage(`❌ "${actionName}" отменено`);
                return { success: false, cooldownText: null, cancelled: true };
            }
        } else {
            showMessage(`💔 Не хватает ${actionCost}💎 для "${actionName}"! У тебя ${gameData.gems}💎`);
            return { success: false, cooldownText: null };
        }
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

function forceWakeUp() {
    if (!isSleeping()) {
        showMessage(`😸 ${gameData.petName} не спит!`);
        return;
    }
    const price = getActionPrice('wakeup');
    if (gameData.gems >= price) {
        const confirmed = confirm(`💎 ВНИМАНИЕ! 💎\n\nТы хочешь потратить ${price}💎 чтобы разбудить ${gameData.petName}?\n\nСчастье упадёт на 20%!\n\nНа счету: ${gameData.gems}💎`);
        if (confirmed) {
            gameData.gems -= price;
            gameData.pet.sleepUntil = null;
            gameData.pet.happiness = Math.max(0, gameData.pet.happiness - 20);
            saveGame();
            showMessage(`🔔 Вы разбудили ${gameData.petName}! -${price}💎, счастье упало на 20%`);
            playSound(660);
            startConfetti();
            updatePetBars();
            updateGemsUI();
            updateSleepButton();
            updateActionLimitsDisplay();
            updateStatusTimers();
        } else {
            showMessage(`❌ Пробуждение отменено`);
        }
    } else {
        showMessage(`💔 Нужно ${price}💎 для пробуждения! У тебя ${gameData.gems}💎`);
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
    if (isSleeping()) {
        showMessage(`😴 ${gameData.petName} спит! Не мешай ей`);
        return;
    }
    if (isSick()) {
        showMessage(`🤢 ${gameData.petName} болеет! Дай лекарство`);
        return;
    }
    
    const price = getActionPrice('feed');
    const result = useDailyLimit('feedCount', 'Покормить', price, 'feedLastTime');
    if (!result.success) return;
    
    let newHunger = gameData.pet.hunger + 35;
    gameData.pet.hunger = Math.min(110, newHunger);
    
    let newEnergy = gameData.pet.energy + 5;
    gameData.pet.energy = Math.min(100, newEnergy);
    
    if (result.free) {
        showMessage(`🍗 ${gameData.petName} поела бесплатно! +35% сытости, +5% энергии (${gameData.pet.feedCount || 0}/${getFreeLimitForAction('feedCount')} бесплатно)`);
    } else {
        showMessage(`🍗 ${gameData.petName} поела! -${price}💎, +35% сытости, +5% энергии`);
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
    if (!isSick()) {
        showMessage(`😊 ${gameData.petName} не болеет!`);
        return;
    }
    const price = getActionPrice('medicine');
    if (gameData.gems >= price) {
        const confirmed = confirm(`💎 ВНИМАНИЕ! 💎\n\nТы хочешь потратить ${price}💎 на лекарство для ${gameData.petName}?\n\nНа счету: ${gameData.gems}💎`);
        if (confirmed) {
            gameData.gems -= price;
            cureFromMedicine();
            startConfetti();
            saveGame();
            updateStatusTimers();
            updateGemsUI();
            updatePetBars();
            showMessage(`💊 ${gameData.petName} получила лекарство! -${price}💎`);
        } else {
            showMessage(`❌ Лекарство не куплено`);
        }
    } else {
        showMessage(`💔 Нужно ${price}💎 для лекарства! У тебя ${gameData.gems}💎`);
    }
}

function giveMilk() {
    if (isSleeping()) {
        showMessage(`😴 ${gameData.petName} спит!`);
        return;
    }
    if (isSick()) {
        showMessage(`🤢 ${gameData.petName} болеет! Нельзя молоко`);
        return;
    }
    
    const price = getActionPrice('milk');
    const result = useDailyLimit('milkCount', 'Напоить', price, 'milkLastTime');
    if (!result.success) return;
    
    let newHunger = gameData.pet.hunger + 15;
    gameData.pet.hunger = Math.min(110, newHunger);
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 10);
    
    let newEnergy = gameData.pet.energy + 3;
    gameData.pet.energy = Math.min(100, newEnergy);
    
    if (result.free) {
        showMessage(`🥛 ${gameData.petName} выпила молоко бесплатно! +15% сыт, +10% счастья, +3% энергии (${gameData.pet.milkCount || 0}/${getFreeLimitForAction('milkCount')} бесплатно)`);
    } else {
        showMessage(`🥛 ${gameData.petName} выпила молоко! -${price}💎, +15% сыт, +10% счастья, +3% энергии`);
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

function petCat() {
    if (isSleeping()) {
        showMessage(`😴 ${gameData.petName} спит!`);
        return;
    }
    
    const cooldown = checkCooldown('petLastTime');
    if (!cooldown.canUse && (gameData.pet.petLastTime || 0) > 0) {
        showMessage(`⏳ Подожди ${cooldown.remainingText} перед следующим "Погладить"!`);
        return;
    }
    
    const price = getActionPrice('pet');
    const result = useDailyLimit('petCount', 'Погладить', price, 'petLastTime');
    if (!result.success) return;
    
    showEmotion('✋❤️');
    
    let newHappiness = gameData.pet.happiness + 5;
    gameData.pet.happiness = Math.min(100, newHappiness);
    
    if (result.free) {
        showMessage(`😊 ${gameData.petName} мурлычет от ласки! +5% счастья (${gameData.pet.petCount || 0}/${getFreeLimitForAction('petCount')} бесплатно в день)`);
    } else {
        showMessage(`😊 ${gameData.petName} мурлычет! -${price}💎, +5% счастья`);
    }
    
    playSound(660);
    saveGame();
    updatePetBars();
    updateActionLimitsDisplay();
}

function playWithCat(type) {
    if (!isGameUnlocked(type)) {
        const currentLevel = getCurrentLevel();
        showMessage(`🔒 Игра "${getGameName(type)}" откроется на уровне "${currentLevel.name}"!`);
        return;
    }
    
    if (isSleeping()) {
        showMessage(`😴 ${gameData.petName} спит!`);
        return;
    }
    if (isSick()) {
        showMessage(`🤢 ${gameData.petName} болеет! Отдыхай`);
        return;
    }
    if (gameData.pet.energy < 15) {
        checkAutoSleep();
        showEmotion('😴💤');
        showMessage(`😴 ${gameData.petName} слишком устала!`);
        return;
    }
    
    let actionKey = '', gameName = '', cooldownKey = '';
    if (type === 'yarn') {
        actionKey = 'playCount';
        gameName = 'Клубок';
        cooldownKey = 'playLastTime';
    } else if (type === 'ball') {
        actionKey = 'playBallCount';
        gameName = 'Мячик';
        cooldownKey = 'playBallLastTime';
    } else if (type === 'laser') {
        actionKey = 'playLaserCount';
        gameName = 'Лазер';
        cooldownKey = 'playLaserLastTime';
    } else if (type === 'candy') {
        actionKey = 'playCandyCount';
        gameName = 'Фантик';
        cooldownKey = 'playCandyLastTime';
    }
    
    const price = getActionPrice('play', type);
    const result = useDailyLimit(actionKey, gameName, price, cooldownKey);
    if (!result.success) return;
    
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 20);
    gameData.pet.energy = Math.max(0, gameData.pet.energy - 12);
    
    const toys = { yarn: '🧶', ball: '⚽', laser: '🔴', candy: '🍬' };
    showEmotion(toys[type] + '🎉');
    
    if (result.free) {
        showMessage(`${toys[type]} Игра "${gameName}" бесплатно! +20% счастья (${gameData.pet[actionKey] || 0}/${getFreeLimitForAction(actionKey)} бесплатно)`);
    } else {
        showMessage(`${toys[type]} Игра "${gameName}"! -${price}💎, +20% счастья`);
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
    if (isSleeping()) {
        showMessage(`😴 ${gameData.petName} спит!`);
        return;
    }
    
    const price = getActionPrice('brush');
    const result = useDailyLimit('brushCount', 'Расчесать', price, 'brushLastTime');
    if (!result.success) return;
    
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 10);
    gameData.pet.clean = Math.min(100, gameData.pet.clean + 10);
    showEmotion('🪮✨');
    
    if (result.free) {
        showMessage(`🪮 Расчёска бесплатно! +10% чистоты, +10% счастья (${gameData.pet.brushCount || 0}/${getFreeLimitForAction('brushCount')} бесплатно)`);
    } else {
        showMessage(`🪮 Расчёска! -${price}💎, +10% чистоты, +10% счастья`);
    }
    
    playSound(740);
    saveGame();
    updatePetBars();
    updateGemsUI();
    updateActionLimitsDisplay();
}

function batheCat() {
    if (isSleeping()) {
        showMessage(`😴 ${gameData.petName} спит!`);
        return;
    }
    
    const price = getActionPrice('bathe');
    const result = useDailyLimit('batheCount', 'Искупать', price, 'batheLastTime');
    if (!result.success) return;
    
    gameData.pet.clean = Math.min(100, gameData.pet.clean + 30);
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 5);
    showEmotion('🛁✨');
    
    if (result.free) {
        showMessage(`🛁 Купание бесплатно! +30% чистоты, +5% счастья (${gameData.pet.batheCount || 0}/${getFreeLimitForAction('batheCount')} бесплатно)`);
    } else {
        showMessage(`🛁 Купание! -${price}💎, +30% чистоты, +5% счастья`);
    }
    
    playSound(780);
    startConfetti();
    saveGame();
    updatePetBars();
    updateGemsUI();
    updateActionLimitsDisplay();
}

function giveGift() {
    if (isSleeping()) {
        showMessage(`😴 ${gameData.petName} спит!`);
        return;
    }
    
    const price = getActionPrice('gift');
    const maxFree = getFreeLimitForAction('giftCount');
    const giftCount = gameData.pet.giftCount || 0;
    
    const cooldown = checkCooldown('giftLastTime');
    if (!cooldown.canUse) {
        showMessage(`⏳ Подожди ${cooldown.remainingText} перед следующим "Подарок"!`);
        return;
    }
    
    if (giftCount < maxFree) {
        gameData.pet.giftCount = giftCount + 1;
        gameData.pet.giftLastTime = Date.now();
        gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 40);
        showEmotion('🎁😻');
        showMessage(`🎁 Подарок бесплатно! +40% счастья (${giftCount + 1}/${maxFree} бесплатно)`);
        playSound(1000);
        startConfetti();
        saveGame();
        updatePetBars();
        updateGemsUI();
        updateActionLimitsDisplay();
        return;
    }
    
    if (gameData.gems >= price) {
        const confirmed = confirm(`💎 ВНИМАНИЕ! 💎\n\nБесплатные подарки на сегодня закончились.\nТы хочешь потратить ${price}💎 на подарок для ${gameData.petName}?\n\n+40% счастья!\n\nНа счету: ${gameData.gems}💎`);
        if (confirmed) {
            gameData.gems -= price;
            gameData.pet.giftLastTime = Date.now();
            gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 40);
            showEmotion('🎁😻');
            showMessage(`🎁 Подарок! -${price}💎, +40% счастья`);
            playSound(1000);
            startConfetti();
            saveGame();
            updatePetBars();
            updateGemsUI();
            updateActionLimitsDisplay();
        } else {
            showMessage(`❌ "Подарок" отменён`);
        }
    } else {
        showMessage(`💔 Не хватает ${price}💎 для подарка! У тебя ${gameData.gems}💎`);
    }
}

function checkSickness() {
    if (gameData.pet.hunger > 100 && !gameData.pet.sickUntil && !isSick()) {
        gameData.pet.sickUntil = Date.now() + CONFIG.SICK_DURATION_MS;
        gameData.pet.happiness = 0;
        showEmotion('🤢💔');
        showMessage(`🤢 ${gameData.petName} переела! Счастье = 0. Поправится через 2 часа или лекарство ${getActionPrice('medicine')}💎`);
        playSound(440);
        saveGame();
        updatePetBars();
    }
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