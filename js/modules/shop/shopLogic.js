function recalcStats() {
    let style = 0, smart = 0, cozy = 0, beauty = 0;
    
    gameData.purchasedAccessories.forEach(accId => {
        const item = SHOP_ITEMS.find(i => i.id === accId);
        if (item && item.statType === 'style') style += item.statValue;
    });
    
    gameData.purchasedFurniture.forEach(furnId => {
        const item = SHOP_ITEMS.find(i => i.id === furnId);
        if (item && item.statType === 'cozy') cozy += item.statValue;
    });
    
    gameData.purchasedDecor.forEach(decorId => {
        const item = SHOP_ITEMS.find(i => i.id === decorId);
        if (item && item.statType === 'beauty') beauty += item.statValue;
    });
    
    gameData.purchasedSmart.forEach(smartId => {
        const item = SHOP_ITEMS.find(i => i.id === smartId);
        if (item && item.statType === 'smart') smart += item.statValue;
    });
    
    gameData.style = style;
    gameData.smartStat = smart;
    gameData.cozy = cozy;
    gameData.beauty = beauty;
    
    const styleStat = document.getElementById('styleStat');
    const smartStat = document.getElementById('smartStat');
    const cozyStat = document.getElementById('cozyStat');
    const beautyStat = document.getElementById('beautyStat');
    
    if (styleStat) styleStat.innerHTML = style;
    if (smartStat) smartStat.innerHTML = smart;
    if (cozyStat) cozyStat.innerHTML = cozy;
    if (beautyStat) beautyStat.innerHTML = beauty;
}

function buyItem(item) {
    if (gameData.gems >= item.price) {
        const confirmed = confirm(`💎 ВНИМАНИЕ! 💎\n\nТы хочешь купить "${item.name}" за ${item.price}💎?\n\nНа счету: ${gameData.gems}💎`);
        
        if (confirmed) {
            gameData.gems -= item.price;
            
            if (item.category === "accessory") {
                if (!gameData.purchasedAccessories.includes(item.id)) {
                    gameData.purchasedAccessories.push(item.id);
                    showMessage(`🎀 ${item.name} куплен! +${item.statValue} к стилю`);
                    playSound(660);
                    startConfetti();
                } else {
                    gameData.gems += item.price;
                    showMessage(`Уже есть`);
                }
            } else if (item.category === "furniture") {
                if (!gameData.purchasedFurniture.includes(item.id)) {
                    gameData.purchasedFurniture.push(item.id);
                    showMessage(`🛋️ ${item.name} в комнате! +${item.statValue} к уюту`);
                    playSound(660);
                    startConfetti();
                } else {
                    gameData.gems += item.price;
                    showMessage(`Уже есть`);
                }
            } else if (item.category === "decor") {
                if (!gameData.purchasedDecor.includes(item.id)) {
                    gameData.purchasedDecor.push(item.id);
                    showMessage(`🌸 ${item.name} украшает комнату! +${item.statValue} к красоте`);
                    playSound(660);
                    startConfetti();
                } else {
                    gameData.gems += item.price;
                    showMessage(`Уже есть`);
                }
            } else if (item.category === "smart") {
                if (!gameData.purchasedSmart.includes(item.id)) {
                    gameData.purchasedSmart.push(item.id);
                    showMessage(`📚 ${item.name} развивает Мурку! +${item.statValue} к уму`);
                    playSound(660);
                    startConfetti();
                } else {
                    gameData.gems += item.price;
                    showMessage(`Уже есть`);
                }
            }
            
            recalcStats();
            saveGame();
            renderShop();
            renderRoomModal();
            updateGemsUI();
        } else {
            showMessage(`❌ Покупка "${item.name}" отменена`);
        }
    } else {
        showMessage(`💔 Нужно ${item.price}💎 для покупки "${item.name}"! У тебя ${gameData.gems}💎`);
    }
}

function toggleAroundItem(itemId, slot) {
    if (slot === 'right') {
        gameData.activeRight = (gameData.activeRight === itemId ? null : itemId);
    } else if (slot === 'left') {
        gameData.activeLeft = (gameData.activeLeft === itemId ? null : itemId);
    } else if (slot === 'top') {
        gameData.activeTop = (gameData.activeTop === itemId ? null : itemId);
    }
    
    saveGame();
    updateAroundItems();
    renderRoomModal();
    
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (item) {
        const isActive = gameData.activeRight === itemId || gameData.activeLeft === itemId || gameData.activeTop === itemId;
        showMessage(`${isActive ? '✨ Активировано' : '❌ Деактивировано'}: ${item.name}`);
    }
    playSound(660);
}

function toggleAccessory(accId) {
    if (gameData.pet.currentAccessory === accId) {
        gameData.pet.currentAccessory = null;
    } else {
        gameData.pet.currentAccessory = accId;
    }
    
    const acc = SHOP_ITEMS.find(i => i.id === accId);
    showMessage(`✨ ${acc.name} ${gameData.pet.currentAccessory ? 'надет' : 'снят'} на ${gameData.petName}! ✨`);
    playSound(660);
    saveGame();
    updatePetAvatarUI();
    renderRoomModal();
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