function renderShop() {
    const cont = document.getElementById('shopContainer');
    if (!cont) return;
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
            
            div.innerHTML = `
                <div class="shop-icon">${i.icon}</div>
                <div class="shop-info">
                    <div class="shop-name">${i.name}</div>
                    <div class="shop-price">${i.price} 💎</div>
                    ${statText}
                </div>
                <div class="owned-badge">🛒</div>
            `;
            cont.appendChild(div);
        }
    });
    
    if (cont.children.length === 0) {
        cont.innerHTML = '<div style="text-align:center; padding:40px;">🎉 Всё куплено! 🎉</div>';
    }
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
            div.innerHTML = `
                <div class="collectible-icon">${item.icon}</div>
                <div class="collectible-name">${item.name}</div>
                <div class="collectible-stat">+${item.statValue} 🧥</div>
                ${isEquipped ? '<div class="equipped-badge">🐱</div>' : ''}
            `;
            div.onclick = () => toggleAccessory(item.id);
            accContainer.appendChild(div);
        });
        
        if (accessories.length === 0) {
            accContainer.innerHTML = '<div style="grid-column:span3; text-align:center; padding:20px;">✨ Купи аксессуары ✨</div>';
        }
    }
    
    const furnContainer = document.getElementById('furnitureRoom');
    if (furnContainer) {
        furnContainer.innerHTML = '';
        const furniture = SHOP_ITEMS.filter(i => i.category === 'furniture' && gameData.purchasedFurniture.includes(i.id));
        
        furniture.forEach(item => {
            const div = document.createElement('div');
            div.className = 'collectible-item';
            const isActive = gameData.activeRight === item.id;
            div.innerHTML = `
                <div class="collectible-icon">${item.icon}</div>
                <div class="collectible-name">${item.name}</div>
                <div class="collectible-stat">+${item.statValue} 🏠</div>
                ${isActive ? '<div class="equipped-badge">✔️</div>' : ''}
            `;
            div.onclick = () => toggleAroundItem(item.id, 'right');
            furnContainer.appendChild(div);
        });
        
        if (furniture.length === 0) {
            furnContainer.innerHTML = '<div style="grid-column:span3; text-align:center; padding:20px;">🛋️ Купи мебель 🛋️</div>';
        }
    }
    
    const decorContainer = document.getElementById('decorRoom');
    if (decorContainer) {
        decorContainer.innerHTML = '';
        const decor = SHOP_ITEMS.filter(i => i.category === 'decor' && gameData.purchasedDecor.includes(i.id));
        
        decor.forEach(item => {
            const div = document.createElement('div');
            div.className = 'collectible-item';
            const isActive = gameData.activeLeft === item.id;
            div.innerHTML = `
                <div class="collectible-icon">${item.icon}</div>
                <div class="collectible-name">${item.name}</div>
                <div class="collectible-stat">+${item.statValue} 🌸</div>
                ${isActive ? '<div class="equipped-badge">✔️</div>' : ''}
            `;
            div.onclick = () => toggleAroundItem(item.id, 'left');
            decorContainer.appendChild(div);
        });
        
        if (decor.length === 0) {
            decorContainer.innerHTML = '<div style="grid-column:span3; text-align:center; padding:20px;">🌸 Купи декор 🌸</div>';
        }
    }
    
    const smartContainer = document.getElementById('smartRoom');
    if (smartContainer) {
        smartContainer.innerHTML = '';
        const smart = SHOP_ITEMS.filter(i => i.category === 'smart' && gameData.purchasedSmart.includes(i.id));
        
        smart.forEach(item => {
            const div = document.createElement('div');
            div.className = 'collectible-item';
            const isActive = gameData.activeTop === item.id;
            div.innerHTML = `
                <div class="collectible-icon">${item.icon}</div>
                <div class="collectible-name">${item.name}</div>
                <div class="collectible-stat">+${item.statValue} 📚</div>
                ${isActive ? '<div class="equipped-badge">✔️</div>' : ''}
            `;
            div.onclick = () => toggleAroundItem(item.id, 'top');
            smartContainer.appendChild(div);
        });
        
        if (smart.length === 0) {
            smartContainer.innerHTML = '<div style="grid-column:span3; text-align:center; padding:20px;">📚 Купи умные вещи 📚</div>';
        }
    }
}

function openRoom() {
    renderRoomModal();
    const roomModal = document.getElementById('roomModal');
    if (roomModal) roomModal.classList.add('active');
}

function closeRoom() {
    const roomModal = document.getElementById('roomModal');
    if (roomModal) roomModal.classList.remove('active');
}