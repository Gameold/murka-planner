// Обновление UI

function updatePetBars() {
    let hungerPercent = gameData.pet.hunger;
    const hungerFill = document.getElementById('hungerFill');
    if (hungerFill) hungerFill.style.width = Math.min(100, hungerPercent) + '%';
    if (hungerPercent > 100) {
        if (hungerFill) hungerFill.style.background = '#ff6b6b';
        const hungerValue = document.getElementById('hungerValue');
        if (hungerValue) hungerValue.innerHTML = '💥 ПЕРЕЕД!';
    } else {
        if (hungerFill) hungerFill.style.background = '#ffb347';
        const hungerValue = document.getElementById('hungerValue');
        if (hungerValue) hungerValue.innerHTML = Math.floor(hungerPercent) + '%';
    }
    
    const happinessFill = document.getElementById('happinessFill');
    if (happinessFill) happinessFill.style.width = gameData.pet.happiness + '%';
    const happinessValue = document.getElementById('happinessValue');
    if (happinessValue) happinessValue.innerHTML = Math.floor(gameData.pet.happiness) + '%';
    
    const energyFill = document.getElementById('energyFill');
    if (energyFill) energyFill.style.width = gameData.pet.energy + '%';
    const energyValue = document.getElementById('energyValue');
    if (energyValue) energyValue.innerHTML = Math.floor(gameData.pet.energy) + '%';
    
    const cleanFill = document.getElementById('cleanFill');
    if (cleanFill) cleanFill.style.width = gameData.pet.clean + '%';
    const cleanValue = document.getElementById('cleanValue');
    if (cleanValue) cleanValue.innerHTML = Math.floor(gameData.pet.clean) + '%';
    
    updatePetAvatarUI();
    updateAroundItems();
    updateGamesByLevel();
    
    const av = document.getElementById('petAvatar');
    if (av) {
        if (isSleeping()) av.innerHTML = '💤😴💤';
        else if (isSick()) av.innerHTML = '🤢';
        else if (gameData.pet.hunger > 100) av.innerHTML = '🤢';
        else if (gameData.pet.energy < 15) av.innerHTML = '😴';
        else if (gameData.pet.hunger < 20) av.innerHTML = '😿';
        else if (gameData.pet.happiness < 20) av.innerHTML = '😢';
        else updatePetAvatarByLevel();
    }
}

function updatePetAvatarUI() {
    let vis = "";
    if (gameData.pet.currentAccessory) {
        const acc = SHOP_ITEMS.find(i => i.id === gameData.pet.currentAccessory);
        if (acc && acc.accessoryVisual) vis = acc.accessoryVisual;
    }
    const accessoryOnPet = document.getElementById('accessoryOnPet');
    if (accessoryOnPet) accessoryOnPet.innerHTML = vis;
}

function updateAroundItems() {
    const rightItem = SHOP_ITEMS.find(i => i.id === gameData.activeRight);
    const leftItem = SHOP_ITEMS.find(i => i.id === gameData.activeLeft);
    const topItem = SHOP_ITEMS.find(i => i.id === gameData.activeTop);
    
    const rightItemEl = document.getElementById('rightItem');
    if (rightItemEl) rightItemEl.innerHTML = rightItem ? rightItem.aroundIcon || rightItem.icon : '';
    const leftItemEl = document.getElementById('leftItem');
    if (leftItemEl) leftItemEl.innerHTML = leftItem ? leftItem.aroundIcon || leftItem.icon : '';
    const topItemEl = document.getElementById('topItem');
    if (topItemEl) topItemEl.innerHTML = topItem ? topItem.aroundIcon || topItem.icon : '';
}

function updateGamesByLevel() {
    const currentLevel = getCurrentLevel();
    const allowedGames = currentLevel.unlockGames;
    
    const gameButtons = {
        yarn: document.getElementById('actionPlayYarn'),
        ball: document.getElementById('actionPlayBall'),
        laser: document.getElementById('actionPlayLaser'),
        candy: document.getElementById('actionPlayCandy')
    };
    
    Object.entries(gameButtons).forEach(([game, btn]) => {
        if (btn) {
            if (!allowedGames.includes(game)) {
                btn.classList.add('disabled');
                btn.style.opacity = '0.5';
                // Убираем pointer-events: none, чтобы кнопка была кликабельной
                btn.style.pointerEvents = 'auto';
                const gameName = { yarn: 'Клубок', ball: 'Мячик', laser: 'Лазер', candy: 'Фантик' }[game];
                btn.title = `🔒 Доступно на уровне "${currentLevel.name}"`;
                
                // Добавляем обработчик для показа сообщения
                btn.onclick = (e) => {
                    e.stopPropagation();
                    showMessage(`🔒 Игра "${gameName}" откроется на уровне "${currentLevel.name}"!`);
                };
            } else {
                // Для доступных игр - проверяем кулдаун
                const cooldownKeys = {
                    yarn: 'playLastTime',
                    ball: 'playBallLastTime',
                    laser: 'playLaserLastTime',
                    candy: 'playCandyLastTime'
                };
                const cooldown = checkCooldown(cooldownKeys[game]);
                if (cooldown.canUse) {
                    btn.classList.remove('disabled');
                }
                btn.style.opacity = '';
                btn.style.pointerEvents = '';
                btn.title = '';
                // Восстанавливаем обработчик для доступных игр
                btn.onclick = () => playWithCat(game);
            }
        }
    });
}
function updateButtonCooldown(btnId, emoji, name, price, countKey, cooldownKey, defaultLimitId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    
    const count = gameData.pet[countKey] || 0;
    const cooldown = checkCooldown(cooldownKey);
    const sleeping = isSleeping();
    const sick = isSick();
    
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
    
    if ((sleeping || sick) && btnId !== 'actionSleep') {
        btn.classList.add('disabled');
        emojiSpan.innerHTML = emoji;
        limitSpan.innerHTML = `${count}/5`;
        nameSpan.innerHTML = name;
        priceSpan.innerHTML = price;
        return;
    }
    
    if (!cooldown.canUse) {
        emojiSpan.innerHTML = '⏳';
        limitSpan.innerHTML = cooldown.remainingText;
        btn.classList.add('disabled');
    } else {
        emojiSpan.innerHTML = emoji;
        limitSpan.innerHTML = `${count}/5`;
        btn.classList.remove('disabled');
    }
    
    nameSpan.innerHTML = name;
    priceSpan.innerHTML = price;
}

function updateActionLimitsDisplay() {
    const sleeping = isSleeping();
    const sick = isSick();
    
    // Обновляем отображение бесплатных попыток
    const limitsMap = {
        feedLimit: 'feedCount',
        milkLimit: 'milkCount',
        sleepLimit: 'sleepCount',
        petLimit: 'petCount',
        playLimit: 'playCount',
        playBallLimit: 'playBallCount',
        playLaserLimit: 'playLaserCount',
        playCandyLimit: 'playCandyCount',
        brushLimit: 'brushCount',
        batheLimit: 'batheCount',
        giftLimit: 'giftCount',
        litterLimit: 'litterCount'
    };
    
    Object.entries(limitsMap).forEach(([elementId, dataKey]) => {
        const el = document.getElementById(elementId);
        if (el) {
            const count = gameData.pet[dataKey] || 0;
            el.innerHTML = `${count}/5`;
        }
    });
    
    // Обновляем все кнопки с кулдаунами
    updateButtonCooldown('actionFeed', '🍗', 'Покормить', '5💎', 'feedCount', 'feedLastTime', 'feedLimit');
    updateButtonCooldown('actionMilk', '🥛', 'Напоить', '5💎', 'milkCount', 'milkLastTime', 'milkLimit');
    updateButtonCooldown('actionPet', '✋', 'Погладить', 'беспл', 'petCount', 'petLastTime', 'petLimit');
    updateButtonCooldown('actionPlayYarn', '🧶', 'Клубок', '5💎', 'playCount', 'playLastTime', 'playLimit');
    updateButtonCooldown('actionPlayBall', '⚽', 'Мячик', '5💎', 'playBallCount', 'playBallLastTime', 'playBallLimit');
    updateButtonCooldown('actionPlayLaser', '🔴', 'Лазер', '5💎', 'playLaserCount', 'playLaserLastTime', 'playLaserLimit');
    updateButtonCooldown('actionPlayCandy', '🍬', 'Фантик', '5💎', 'playCandyCount', 'playCandyLastTime', 'playCandyLimit');
    updateButtonCooldown('actionBrush', '🪮', 'Расчесать', '5💎', 'brushCount', 'brushLastTime', 'brushLimit');
    updateButtonCooldown('actionBathe', '🛁', 'Искупать', '5💎', 'batheCount', 'batheLastTime', 'batheLimit');
    updateButtonCooldown('actionGift', '🎁', 'Подарок', '5💎', 'giftCount', 'giftLastTime', 'giftLimit');
    updateButtonCooldown('actionCleanLitter', '🚽', 'Убрать лоток', '5💎', 'litterCount', 'litterLastTime', 'litterLimit');
    
    // Лекарство
    const medicineBtn = document.getElementById('actionMedicine');
    if (medicineBtn) {
        if (sick) {
            medicineBtn.classList.remove('disabled');
        } else {
            medicineBtn.classList.add('disabled');
        }
    }
    
    // Игры по уровню - НЕ удаляем disabled у кнопок с активным кулдауном
    if (!sleeping && !sick) {
        const currentLevel = getCurrentLevel();
        const allowedGames = currentLevel.unlockGames;
        
        const gameButtons = {
            yarn: document.getElementById('actionPlayYarn'),
            ball: document.getElementById('actionPlayBall'),
            laser: document.getElementById('actionPlayLaser'),
            candy: document.getElementById('actionPlayCandy')
        };
        
        Object.entries(gameButtons).forEach(([game, btn]) => {
            if (btn) {
                if (!allowedGames.includes(game)) {
                    btn.classList.add('disabled');
                    btn.style.opacity = '0.5';
                } else {
                    // Проверяем, есть ли активный кулдаун - если есть, НЕ удаляем disabled
                    const cooldownKeys = {
                        yarn: 'playLastTime',
                        ball: 'playBallLastTime',
                        laser: 'playLaserLastTime',
                        candy: 'playCandyLastTime'
                    };
                    const cooldown = checkCooldown(cooldownKeys[game]);
                    if (cooldown.canUse) {
                        btn.classList.remove('disabled');
                    }
                    btn.style.opacity = '';
                }
            }
        });
    }
    
    // ВЫЗЫВАЕМ updateSleepButton САМОЙ ПОСЛЕДНЕЙ, чтобы она не сбросила disabled у других кнопок
    updateSleepButton();
}

function updatePetCooldownUI() {
    const petBtn = document.getElementById('actionPet');
    const petBtnText = document.getElementById('petBtnText');
    if (!petBtn || !petBtnText) return;
    
    const lastPet = gameData.pet.petLastTime || 0;
    const now = Date.now();
    const cooldown = 5 * 60 * 1000;
    const timeLeft = cooldown - (now - lastPet);
    const sleeping = isSleeping();

    if (sleeping) {
        petBtnText.innerHTML = '😴 Спит';
        petBtn.classList.add('disabled');
    } else if (timeLeft > 0 && lastPet > 0) {
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        petBtnText.innerHTML = `⏳ ${minutes}:${seconds.toString().padStart(2, '0')}`;
        petBtn.classList.add('disabled');
    } else {
        petBtnText.innerHTML = 'Погладить';
        petBtn.classList.remove('disabled');
    }
}

function updateStatusTimers() {
    const timerDiv = document.getElementById('statusTimer');
    if (!timerDiv) return;
    
    const now = Date.now();
    if (isSleeping()) {
        const remaining = Math.ceil((gameData.pet.sleepUntil - now) / 1000);
        const minutes = Math.floor(remaining / 60), seconds = remaining % 60;
        timerDiv.style.display = 'block';
        if (gameData.pet.energy <= 15 && !gameData.pet.sleepCount) {
            timerDiv.innerHTML = `💤 Устала, спит ${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timerDiv.innerHTML = `😴 Спит ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    } else if (isSick()) {
        const remaining = Math.ceil((gameData.pet.sickUntil - now) / 1000);
        const minutes = Math.floor(remaining / 60), seconds = remaining % 60;
        timerDiv.style.display = 'block';
        timerDiv.innerHTML = `🤢 Болеет ${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
        timerDiv.style.display = 'none';
    }
}

function updatePetStats() {
    const now = Date.now(), last = gameData.pet.lastUpdateTime || now, hours = (now - last) / (1000 * 3600);
    wakeUpFromSleep();
    recoverFromSickness();
    
    updateLitterBox();
    renderLitterButton();
    
    if (!isSleeping() && !isSick() && hours > 0.1) {
        let hungerDecay = 8 * (1 - getHungerDecayBonus());
        let happyDecay = 5 * (1 - getHappinessDecayBonus());
        let cleanDecay = 4 * (1 - getCleanDecayBonus());
        
        const levelBonus = getLevelBonus();
        hungerDecay = hungerDecay * (1.5 - levelBonus);
        happyDecay = happyDecay * (1.3 - levelBonus);
        cleanDecay = cleanDecay * (1.4 - levelBonus);
        
        let newHunger = gameData.pet.hunger - (hours * hungerDecay);
        let newHappiness = gameData.pet.happiness - (hours * happyDecay);
        let newEnergy = gameData.pet.energy - (hours * 6);
        let newClean = gameData.pet.clean - (hours * cleanDecay);
        
        gameData.pet.hunger = Math.max(0, Math.min(110, newHunger));
        gameData.pet.happiness = Math.max(0, Math.min(100, newHappiness));
        gameData.pet.energy = Math.max(0, Math.min(100, newEnergy));
        gameData.pet.clean = Math.max(0, Math.min(100, newClean));
        gameData.pet.lastUpdateTime = now;
        saveGame();

        if (gameData.pet.hunger < 20 && !hungerNotifSent) {
            hungerNotifSent = true;
            sendHungerNotification();
        } else if (gameData.pet.hunger >= 25) {
            hungerNotifSent = false;
        }
        
        checkAutoSleep();
    }
    updatePetBars();
    updateActionLimitsDisplay();
    updateStatusTimers();
    updatePetCooldownUI();
    renderLevelProgress();
}

function sendHungerNotification() {
    if (!gameData.notificationsEnabled) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
        new Notification(`🍗 ${gameData.petName} голодна!`, { body: "Покорми питомицу, чтобы она не заболела!" });
    } else if (Notification.permission === "default") {
        Notification.requestPermission();
    }
}

function updateGemsUI() {
    const gemCount = document.getElementById('gemCount');
    if (gemCount) gemCount.innerText = gameData.gems;
    updateMonthProgress();
}

function updateNameUI() {
    const petName = document.getElementById('petName');
    if (petName) petName.innerText = gameData.petName;
}

function updateAllUI() {
    renderTasks();
    updatePetBars();
    renderShop();
    updateGemsUI();
}