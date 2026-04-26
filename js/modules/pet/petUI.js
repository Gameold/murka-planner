function updateSleepButton() {
    const sleepBtn = document.getElementById('actionSleep');
    if (!sleepBtn) return;
    
    const sleeping = isSleeping();
    const sleepCount = gameData.pet.sleepCount || 0;
    const maxFree = getFreeLimitForAction('sleepCount');
    const remainingFree = maxFree - sleepCount;
    
    if (sleeping) {
        sleepBtn.innerHTML = `
            <span class="action-emoji">🔔</span>
            <span class="action-name">Разбудить</span>
            <span class="action-price">${getPriceText('wakeup')}</span>
            <span class="action-limit">сейчас</span>
        `;
        const newBtn = sleepBtn.cloneNode(true);
        sleepBtn.parentNode.replaceChild(newBtn, sleepBtn);
        newBtn.id = 'actionSleep';
        newBtn.classList.remove('disabled');
        newBtn.addEventListener('click', forceWakeUp);
    } else {
        const cooldown = checkCooldown('sleepLastTime');
        
        if (!cooldown.canUse) {
            sleepBtn.innerHTML = `
                <span class="action-emoji">⏳</span>
                <span class="action-name">Уложить спать</span>
                <span class="action-price">${getPriceText('sleep')}</span>
                <span class="action-limit">${cooldown.remainingText}</span>
            `;
        } else {
            let limitHtml = '';
            if (maxFree === 0) {
                limitHtml = `<span class="action-limit" style="color:#e890b0;">💎 платно</span>`;
            } else if (remainingFree > 0) {
                limitHtml = `<span class="action-limit" style="color:#8bc34a;">🎁 ${remainingFree}/${maxFree}</span>`;
            } else {
                limitHtml = `<span class="action-limit" style="color:#e890b0;">💰 ${getPriceText('sleep')}</span>`;
            }
            sleepBtn.innerHTML = `
                <span class="action-emoji">😴</span>
                <span class="action-name">Уложить спать</span>
                <span class="action-price">${getPriceText('sleep')}</span>
                ${limitHtml}
            `;
        }
        const newBtn = sleepBtn.cloneNode(true);
        sleepBtn.parentNode.replaceChild(newBtn, sleepBtn);
        newBtn.id = 'actionSleep';
        if (!cooldown.canUse) {
            newBtn.classList.add('disabled');
        } else {
            newBtn.classList.remove('disabled');
        }
        newBtn.addEventListener('click', sleepCat);
    }
}

function sleepCat() {
    if (isSleeping()) {
        showMessage(`😴 ${gameData.petName} уже спит!`);
        return;
    }
    
    const price = getActionPrice('sleep');
    const maxFree = getFreeLimitForAction('sleepCount');
    const sleepCount = gameData.pet.sleepCount || 0;
    
    const cooldown = checkCooldown('sleepLastTime');
    if (!cooldown.canUse) {
        showMessage(`⏳ Подожди ${cooldown.remainingText} перед следующим "Уложить спать"!`);
        return;
    }
    
    if (sleepCount < maxFree) {
        gameData.pet.sleepCount = sleepCount + 1;
        gameData.pet.sleepLastTime = Date.now();
        gameData.pet.sleepUntil = Date.now() + CONFIG.SLEEP_DURATION_MS;
        showMessage(`😴 ${gameData.petName} уснула бесплатно на 15 минут! (${sleepCount + 1}/${maxFree} бесплатно)`);
        showEmotion('😴💤');
        playSound(500);
        saveGame();
        updatePetBars();
        updateGemsUI();
        updateActionLimitsDisplay();
        startConfetti();
        updateSleepButton();
        return;
    }
    
    if (gameData.gems >= price) {
        const confirmed = confirm(`💎 ВНИМАНИЕ! 💎\n\nБесплатные попытки на сегодня закончились.\nТы хочешь потратить ${price}💎 на "Уложить спать"?\n\nНа счету: ${gameData.gems}💎`);
        
        if (confirmed) {
            gameData.gems -= price;
            gameData.pet.sleepLastTime = Date.now();
            gameData.pet.sleepUntil = Date.now() + CONFIG.SLEEP_DURATION_MS;
            showMessage(`😴 ${gameData.petName} уснула на 15 минут! -${price}💎`);
            showEmotion('😴💤');
            playSound(500);
            saveGame();
            updatePetBars();
            updateGemsUI();
            updateActionLimitsDisplay();
            startConfetti();
            updateSleepButton();
        } else {
            showMessage(`❌ "Уложить спать" отменено`);
        }
    } else {
        showMessage(`💔 Не хватает ${price}💎 для "Уложить спать"! У тебя ${gameData.gems}💎`);
    }
}

function updateButtonCooldown(btnId, emoji, name, priceKey, subKey, countKey, cooldownKey, defaultLimitId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    
    const priceText = subKey ? getPriceText(priceKey, subKey) : getPriceText(priceKey);
    const count = gameData.pet[countKey] || 0;
    const cooldown = checkCooldown(cooldownKey);
    const sleeping = isSleeping();
    const sick = isSick();
    const maxFree = getFreeLimitForAction(countKey);
    const remainingFree = maxFree - count;
    
    let emojiSpan = btn.querySelector('.action-emoji');
    let nameSpan = btn.querySelector('.action-name');
    let priceSpan = btn.querySelector('.action-price');
    let limitSpan = btn.querySelector('.action-limit');
    
    if (!emojiSpan) {
        emojiSpan = document.createElement('span');
        emojiSpan.className = 'action-emoji';
        btn.prepend(emojiSpan);
    }
    if (!nameSpan) {
        nameSpan = document.createElement('span');
        nameSpan.className = 'action-name';
        btn.appendChild(nameSpan);
    }
    if (!priceSpan) {
        priceSpan = document.createElement('span');
        priceSpan.className = 'action-price';
        btn.appendChild(priceSpan);
    }
    if (!limitSpan) {
        limitSpan = document.createElement('span');
        limitSpan.className = 'action-limit';
        if (defaultLimitId) limitSpan.id = defaultLimitId;
        btn.appendChild(limitSpan);
    }
    
    // Обновляем цену
    priceSpan.innerHTML = priceText;
    
    // Обновляем лимит
    if (!cooldown.canUse) {
        emojiSpan.innerHTML = '⏳';
        limitSpan.innerHTML = cooldown.remainingText;
        limitSpan.style.color = '#c284a3';
        btn.classList.add('disabled');
    } else {
        emojiSpan.innerHTML = emoji;
        btn.classList.remove('disabled');
        
        if (maxFree === 0) {
            // Если бесплатных НЕТ вообще - показываем "💎 платно" но я стер
            limitSpan.innerHTML = ``;
            limitSpan.style.color = '#e890b0';
        } else if (remainingFree > 0) {
            // Есть бесплатные попытки
            limitSpan.innerHTML = `🎁 ${remainingFree}/${maxFree}`;
            limitSpan.style.color = '#8bc34a';
        } else {
            // Бесплатные кончились, нужно платить
            limitSpan.innerHTML = `💰 ${priceText}`;
            limitSpan.style.color = '#e890b0';
        }
    }
    
    if ((sleeping || sick) && btnId !== 'actionSleep') {
        btn.classList.add('disabled');
    }
    
    nameSpan.innerHTML = name;
}

function updateActionLimitsDisplay() {
    const sleeping = isSleeping();
    const sick = isSick();
    
    updateButtonCooldown('actionFeed', '🍗', 'Покормить', 'feed', null, 'feedCount', 'feedLastTime', 'feedLimit');
    updateButtonCooldown('actionMilk', '🥛', 'Напоить', 'milk', null, 'milkCount', 'milkLastTime', 'milkLimit');
    updateButtonCooldown('actionPet', '✋', 'Погладить', 'pet', null, 'petCount', 'petLastTime', 'petLimit');
    updateButtonCooldown('actionPlayYarn', '🧶', 'Клубок', 'play', 'yarn', 'playCount', 'playLastTime', 'playLimit');
    updateButtonCooldown('actionPlayBall', '⚽', 'Мячик', 'play', 'ball', 'playBallCount', 'playBallLastTime', 'playBallLimit');
    updateButtonCooldown('actionPlayLaser', '🔴', 'Лазер', 'play', 'laser', 'playLaserCount', 'playLaserLastTime', 'playLaserLimit');
    updateButtonCooldown('actionPlayCandy', '🍬', 'Фантик', 'play', 'candy', 'playCandyCount', 'playCandyLastTime', 'playCandyLimit');
    updateButtonCooldown('actionBrush', '🪮', 'Расчесать', 'brush', null, 'brushCount', 'brushLastTime', 'brushLimit');
    updateButtonCooldown('actionBathe', '🛁', 'Искупать', 'bathe', null, 'batheCount', 'batheLastTime', 'batheLimit');
    updateButtonCooldown('actionGift', '🎁', 'Подарок', 'gift', null, 'giftCount', 'giftLastTime', 'giftLimit');
    updateButtonCooldown('actionCleanLitter', '🚽', 'Убрать лоток', 'litter', null, 'litterCount', 'litterLastTime', 'litterLimit');
    
    const medicineBtn = document.getElementById('actionMedicine');
    if (medicineBtn) {
        const priceSpan = medicineBtn.querySelector('.action-price');
        if (priceSpan) priceSpan.innerHTML = getPriceText('medicine');
        if (sick) {
            medicineBtn.classList.remove('disabled');
        } else {
            medicineBtn.classList.add('disabled');
        }
    }
    
    if (!sleeping && !sick) {
        updateGamesByLevel();
    }
    
    updateSleepButton();
}

function initLitterBox() {
    if (!gameData.pet.lastCleaned) {
        gameData.pet.lastCleaned = Date.now();
    }
    if (gameData.pet.needsLitter === undefined) {
        gameData.pet.needsLitter = 0;
    }
    if (gameData.pet.litterWarningSent === undefined) {
        gameData.pet.litterWarningSent = false;
    }
}

function updateLitterBox() {
    initLitterBox();
    const now = Date.now();
    const hoursSinceClean = (now - (gameData.pet.lastCleaned || now)) / (1000 * 3600);
    
    gameData.pet.needsLitter = Math.min(100, hoursSinceClean * 15);
    
    if (gameData.pet.needsLitter > 80 && !gameData.pet.litterWarningSent) {
        gameData.pet.litterWarningSent = true;
        showMessage(`😿 ${gameData.petName} хочет в туалет! Убери за ней лоток!`);
        playSound(440);
    }
    
    if (gameData.pet.needsLitter > 90 && !isSleeping()) {
        gameData.pet.happiness = Math.max(0, gameData.pet.happiness - 2);
        gameData.pet.clean = Math.max(0, gameData.pet.clean - 3);
    }
    
    if (gameData.pet.needsLitter < 30) {
        gameData.pet.litterWarningSent = false;
    }
}

function cleanLitterBox() {
    if (isSleeping()) {
        showMessage(`😴 ${gameData.petName} спит! Не мешай ей`);
        return;
    }
    if (isSick()) {
        showMessage(`🤢 ${gameData.petName} болеет! Нельзя убирать сейчас`);
        return;
    }
    
    const price = getActionPrice('litter');
    const result = useDailyLimit('litterCount', 'Убрать лоток', price, 'litterLastTime');
    if (!result.success) return;
    
    gameData.pet.lastCleaned = Date.now();
    gameData.pet.needsLitter = 0;
    gameData.pet.clean = Math.min(100, gameData.pet.clean + 15);
    gameData.pet.happiness = Math.min(100, gameData.pet.happiness + 5);
    showEmotion('🧹✨');
    
    if (result.free) {
        showMessage(`🧹 Лоток убран бесплатно! +15% чистоты, +5% счастья (${gameData.pet.litterCount || 0}/${getFreeLimitForAction('litterCount')})`);
    } else {
        showMessage(`🧹 Лоток убран! -${price}💎, +15% чистоты, +5% счастья`);
    }
    
    playSound(820);
    saveGame();
    updatePetBars();
    updateGemsUI();
    renderLitterButton();
}

function renderLitterButton() {
    const actionButtons = document.getElementById('actionButtonsContainer');
    if (!actionButtons) return;
    
    let litterBtn = document.getElementById('actionCleanLitter');
    if (!litterBtn) {
        const newBtn = document.createElement('div');
        newBtn.id = 'actionCleanLitter';
        newBtn.className = 'action-btn';
        newBtn.innerHTML = `<span class="action-emoji">🚽</span><span class="action-name">Убрать лоток</span><span class="action-price">${getPriceText('litter')}</span><span class="action-limit" id="litterLimit">0/5</span>`;
        newBtn.onclick = cleanLitterBox;
        actionButtons.appendChild(newBtn);
        litterBtn = newBtn;
    }
    
    const needsPercent = gameData.pet.needsLitter || 0;
    const limitSpan = document.getElementById('litterLimit');
    if (limitSpan) {
        if (needsPercent > 80) limitSpan.innerHTML = '⚠️ СРОЧНО!';
        else if (needsPercent > 50) limitSpan.innerHTML = '🟡 Скоро нужно';
        else if (needsPercent > 20) limitSpan.innerHTML = '🟢 Нормально';
        else limitSpan.innerHTML = '✨ Чисто';
    }
    
    const isDisabled = isSleeping() || isSick();
    litterBtn.classList.toggle('disabled', isDisabled);
}

function createActionButtons() {
    const container = document.getElementById('actionButtonsContainer');
    if (!container) return;
    
    const buttons = [
        { id: 'actionFeed', emoji: '🍗', name: 'Покормить', priceKey: 'feed', limitId: 'feedLimit' },
        { id: 'actionMilk', emoji: '🥛', name: 'Напоить', priceKey: 'milk', limitId: 'milkLimit' },
        { id: 'actionSleep', emoji: '😴', name: 'Уложить спать', priceKey: 'sleep', limitId: 'sleepLimit' },
        { id: 'actionMedicine', emoji: '💊', name: 'Лекарство', priceKey: 'medicine', limitText: 'болезнь' },
        { id: 'actionPet', emoji: '✋', name: 'Погладить', priceKey: 'pet', limitId: 'petLimit' },
        { id: 'actionPlayYarn', emoji: '🧶', name: 'Клубок', priceKey: 'play', subKey: 'yarn', limitId: 'playLimit' },
        { id: 'actionPlayBall', emoji: '⚽', name: 'Мячик', priceKey: 'play', subKey: 'ball', limitId: 'playBallLimit' },
        { id: 'actionPlayLaser', emoji: '🔴', name: 'Лазер', priceKey: 'play', subKey: 'laser', limitId: 'playLaserLimit' },
        { id: 'actionPlayCandy', emoji: '🍬', name: 'Фантик', priceKey: 'play', subKey: 'candy', limitId: 'playCandyLimit' },
        { id: 'actionBrush', emoji: '🪮', name: 'Расчесать', priceKey: 'brush', limitId: 'brushLimit' },
        { id: 'actionBathe', emoji: '🛁', name: 'Искупать', priceKey: 'bathe', limitId: 'batheLimit' },
        { id: 'actionGift', emoji: '🎁', name: 'Подарок', priceKey: 'gift', limitId: 'giftLimit' }
    ];
    
    buttons.forEach(btn => {
        const btnDiv = document.createElement('div');
        btnDiv.id = btn.id;
        btnDiv.className = 'action-btn';
        
        let priceText = '';
        if (btn.subKey) {
            priceText = getPriceText(btn.priceKey, btn.subKey);
        } else {
            priceText = getPriceText(btn.priceKey);
        }
        
        btnDiv.innerHTML = `
            <span class="action-emoji">${btn.emoji}</span>
            <span class="action-name">${btn.name}</span>
            <span class="action-price">${priceText}</span>
            <span class="action-limit" id="${btn.limitId || ''}">${btn.limitText || '0/5'}</span>
        `;
        container.appendChild(btnDiv);
    });
}