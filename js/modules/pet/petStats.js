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
    if (rightItemEl) rightItemEl.innerHTML = rightItem ? (rightItem.aroundIcon || rightItem.icon) : '';
    const leftItemEl = document.getElementById('leftItem');
    if (leftItemEl) leftItemEl.innerHTML = leftItem ? (leftItem.aroundIcon || leftItem.icon) : '';
    const topItemEl = document.getElementById('topItem');
    if (topItemEl) topItemEl.innerHTML = topItem ? (topItem.aroundIcon || topItem.icon) : '';
}

function updatePetCooldownUI() {
    const petBtn = document.getElementById('actionPet');
    const petBtnText = document.getElementById('petBtnText');
    if (!petBtn || !petBtnText) return;
    
    const lastPet = gameData.pet.petLastTime || 0;
    const now = Date.now();
    const timeLeft = CONFIG.COOLDOWN_MS - (now - lastPet);
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
    const now = Date.now();
    const last = gameData.pet.lastUpdateTime || now;
    const hours = (now - last) / (1000 * 3600);
    
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

function checkAutoSleep() {
    if (isSleeping() || isSick()) return;
    
    if (gameData.pet.energy <= 15) {
        gameData.pet.sleepUntil = Date.now() + CONFIG.SLEEP_DURATION_MS;
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

function initStatHints() {
    const statBars = [
        { 
            id: 'hungerFill', 
            container: 'hungerValue', 
            name: '🍗 Сытость', 
            actions: ['Покормить 🍗 (+35% сыт, +5% энергия)', 'Напоить 🥛 (+15% сыт, +10% счастье, +3% энергия)']
        },
        { 
            id: 'happinessFill', 
            container: 'happinessValue', 
            name: '😊 Счастье', 
            actions: ['Погладить ✋ (+5% счастье, бесплатно 5/день)', 'Подарок 🎁 (+40% счастье)', 'Клубок 🧶 (+20% счастье)', 'Мячик ⚽ (+20% счастье)', 'Лазер 🔴 (+20% счастье)', 'Фантик 🍬 (+20% счастье)', 'Напоить 🥛 (+10% счастье)']
        },
        { 
            id: 'energyFill', 
            container: 'energyValue', 
            name: '⚡ Энергия', 
            actions: ['Уложить спать 😴 (+50% энергия)', 'Покормить 🍗 (+5% энергия)', 'Напоить 🥛 (+3% энергия)']
        },
        { 
            id: 'cleanFill', 
            container: 'cleanValue', 
            name: '🧼 Чистота', 
            actions: ['Расчесать 🪮 (+10% чистота, +10% счастье)', 'Искупать 🛁 (+30% чистота, +5% счастье)', 'Убрать лоток 🚽 (+15% чистота, +5% счастье)']
        }
    ];
    
    statBars.forEach(stat => {
        const bar = document.getElementById(stat.id);
        if (bar) {
            bar.style.cursor = 'pointer';
            bar.addEventListener('click', (e) => {
                e.stopPropagation();
                showStatHint(stat.name, stat.actions);
            });
        }
        
        const valueEl = document.getElementById(stat.container);
        if (valueEl) {
            valueEl.style.cursor = 'pointer';
            valueEl.addEventListener('click', (e) => {
                e.stopPropagation();
                showStatHint(stat.name, stat.actions);
            });
        }
    });
}

function showStatHint(statName, actions) {
    const modal = document.createElement('div');
    modal.className = 'stat-hint-modal';
    modal.innerHTML = `
        <div class="stat-hint-content">
            <div class="stat-hint-header">
                <span class="stat-hint-icon">📊</span>
                <span class="stat-hint-title">Как повысить ${statName}?</span>
                <button class="stat-hint-close">✕</button>
            </div>
            <div class="stat-hint-actions">
                ${actions.map(action => `<div class="stat-hint-action">→ ${action}</div>`).join('')}
            </div>
            <div class="stat-hint-note">
                💡 Бесплатно: 5 раз в день<br>
                💎 После лимита: цены разные (от 2 до 12 алмазов)<br>
                🎮 Игры открываются с уровнем питомца
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.stat-hint-close');
    closeBtn.onclick = () => modal.remove();
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}