// Магазин и комната

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
    document.getElementById('styleStat').innerHTML = style;
    document.getElementById('smartStat').innerHTML = smart;
    document.getElementById('cozyStat').innerHTML = cozy;
    document.getElementById('beautyStat').innerHTML = beauty;
}

function buyItem(item) {
    if (gameData.gems >= item.price) {
        gameData.gems -= item.price;
        if (item.category === "accessory") {
            if (!gameData.purchasedAccessories.includes(item.id)) {
                gameData.purchasedAccessories.push(item.id);
                showMessage(`🎀 ${item.name} куплен! +${item.statValue} к стилю`);
                playSound(660);
                startConfetti();
            } else { gameData.gems += item.price; showMessage(`Уже есть`); }
        } else if (item.category === "furniture") {
            if (!gameData.purchasedFurniture.includes(item.id)) {
                gameData.purchasedFurniture.push(item.id);
                showMessage(`🛋️ ${item.name} в комнате! +${item.statValue} к уюту`);
                playSound(660);
                startConfetti();
            } else { gameData.gems += item.price; showMessage(`Уже есть`); }
        } else if (item.category === "decor") {
            if (!gameData.purchasedDecor.includes(item.id)) {
                gameData.purchasedDecor.push(item.id);
                showMessage(`🌸 ${item.name} украшает комнату! +${item.statValue} к красоте`);
                playSound(660);
                startConfetti();
            } else { gameData.gems += item.price; showMessage(`Уже есть`); }
        } else if (item.category === "smart") {
            if (!gameData.purchasedSmart.includes(item.id)) {
                gameData.purchasedSmart.push(item.id);
                showMessage(`📚 ${item.name} развивает Мурку! +${item.statValue} к уму`);
                playSound(660);
                startConfetti();
            } else { gameData.gems += item.price; showMessage(`Уже есть`); }
        }
        recalcStats();
        saveGame();
        renderShop();
        renderRoomModal();
        updateGemsUI();
    } else showMessage(`💔 Нужно ${item.price}💎`);
}

function toggleAroundItem(itemId, slot) {
    if (slot === 'right') { gameData.activeRight = (gameData.activeRight === itemId ? null : itemId); }
    else if (slot === 'left') { gameData.activeLeft = (gameData.activeLeft === itemId ? null : itemId); }
    else if (slot === 'top') { gameData.activeTop = (gameData.activeTop === itemId ? null : itemId); }
    saveGame();
    updateAroundItems();
    renderRoomModal();
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (item) showMessage(`${gameData.activeRight === itemId || gameData.activeLeft === itemId || gameData.activeTop === itemId ? '✨ Активировано' : '❌ Деактивировано'}: ${item.name}`);
    playSound(660);
}

function toggleAccessory(accId) {
    if (gameData.pet.currentAccessory === accId) gameData.pet.currentAccessory = null;
    else gameData.pet.currentAccessory = accId;
    const acc = SHOP_ITEMS.find(i => i.id === accId);
    showMessage(`✨ ${acc.name} ${gameData.pet.currentAccessory ? 'надет' : 'снят'} на ${gameData.petName}! ✨`);
    playSound(660);
    saveGame();
    updatePetAvatarUI();
    renderRoomModal();
}

function renderShop() {
    const cont = document.getElementById('shopContainer');
    cont.innerHTML = '';
    SHOP_ITEMS.forEach(i => {
        let owned = false;
        if (i.category === 'accessory') owned = gameData.purchasedAccessories.includes(i.id);
        else if (i.category === 'furniture') owned = gameData.purchasedFurniture.includes(i.id);
        else if (i.category === 'decor') owned = gameData.purchasedDecor.includes(i.id);
        else if (i.category === 'smart') owned = gameData.purchasedSmart.includes(i.id);
        if (!owned) {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.onclick = () => buyItem(i);
            let statText = '';
            if (i.statType) statText = `<div class="shop-stat">+${i.statValue} ${getStatName(i.statType)}</div>`;
            div.innerHTML = `<div class="shop-icon">${i.icon}</div><div class="shop-info"><div class="shop-name">${i.name}</div><div class="shop-price">${i.price} 💎</div>${statText}</div><div class="owned-badge">🛒</div>`;
            cont.appendChild(div);
        }
    });
    if (cont.children.length === 0) cont.innerHTML = '<div style="text-align:center; padding:40px;">🎉 Всё куплено! 🎉</div>';
}

function renderRoomModal() {
    const accContainer = document.getElementById('accessoriesRoom');
    if (accContainer) {
        accContainer.innerHTML = '';
        const accessories = SHOP_ITEMS.filter(i => i.category === 'accessory' && gameData.purchasedAccessories.includes(i.id));
        accessories.forEach(item => {
            const div = document.createElement('div');
            div.className = 'collectible-item';
            const isEquipped = gameData.pet.currentAccessory === item.id;
            div.innerHTML = `<div class="collectible-icon">${item.icon}</div><div class="collectible-name">${item.name}</div><div class="collectible-stat">+${item.statValue} 🧥</div>${isEquipped ? '<div class="equipped-badge">🐱</div>' : ''}`;
            div.onclick = () => toggleAccessory(item.id);
            accContainer.appendChild(div);
        });
        if (accessories.length === 0) accContainer.innerHTML = '<div style="grid-column:span3; text-align:center; padding:20px;">✨ Купи аксессуары ✨</div>';
    }
    const furnContainer = document.getElementById('furnitureRoom');
    if (furnContainer) {
        furnContainer.innerHTML = '';
        const furniture = SHOP_ITEMS.filter(i => i.category === 'furniture' && gameData.purchasedFurniture.includes(i.id));
        furniture.forEach(item => {
            const div = document.createElement('div');
            div.className = 'collectible-item';
            const isActive = gameData.activeRight === item.id;
            div.innerHTML = `<div class="collectible-icon">${item.icon}</div><div class="collectible-name">${item.name}</div><div class="collectible-stat">+${item.statValue} 🏠</div>${isActive ? '<div class="equipped-badge">✔️</div>' : ''}`;
            div.onclick = () => toggleAroundItem(item.id, 'right');
            furnContainer.appendChild(div);
        });
        if (furniture.length === 0) furnContainer.innerHTML = '<div style="grid-column:span3; text-align:center; padding:20px;">🛋️ Купи мебель 🛋️</div>';
    }
    const decorContainer = document.getElementById('decorRoom');
    if (decorContainer) {
        decorContainer.innerHTML = '';
        const decor = SHOP_ITEMS.filter(i => i.category === 'decor' && gameData.purchasedDecor.includes(i.id));
        decor.forEach(item => {
            const div = document.createElement('div');
            div.className = 'collectible-item';
            const isActive = gameData.activeLeft === item.id;
            div.innerHTML = `<div class="collectible-icon">${item.icon}</div><div class="collectible-name">${item.name}</div><div class="collectible-stat">+${item.statValue} 🌸</div>${isActive ? '<div class="equipped-badge">✔️</div>' : ''}`;
            div.onclick = () => toggleAroundItem(item.id, 'left');
            decorContainer.appendChild(div);
        });
        if (decor.length === 0) decorContainer.innerHTML = '<div style="grid-column:span3; text-align:center; padding:20px;">🌸 Купи декор 🌸</div>';
    }
    const smartContainer = document.getElementById('smartRoom');
    if (smartContainer) {
        smartContainer.innerHTML = '';
        const smart = SHOP_ITEMS.filter(i => i.category === 'smart' && gameData.purchasedSmart.includes(i.id));
        smart.forEach(item => {
            const div = document.createElement('div');
            div.className = 'collectible-item';
            const isActive = gameData.activeTop === item.id;
            div.innerHTML = `<div class="collectible-icon">${item.icon}</div><div class="collectible-name">${item.name}</div><div class="collectible-stat">+${item.statValue} 📚</div>${isActive ? '<div class="equipped-badge">✔️</div>' : ''}`;
            div.onclick = () => toggleAroundItem(item.id, 'top');
            smartContainer.appendChild(div);
        });
        if (smart.length === 0) smartContainer.innerHTML = '<div style="grid-column:span3; text-align:center; padding:20px;">📚 Купи умные вещи 📚</div>';
    }
}