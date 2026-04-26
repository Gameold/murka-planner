function saveGame() {
    // Сохраняем локально
    localStorage.setItem("tamagochiPlannerFinal", JSON.stringify(gameData));
    
    // Сохраняем в облако с русскими ключами
    if (typeof auth !== 'undefined' && auth.currentUser) {
        const userId = auth.currentUser.uid;
        const userEmail = auth.currentUser.email;
        const userName = auth.currentUser.displayName || userEmail.split('@')[0];
        const now = new Date().toISOString().split('T')[0];
        
        // Проверяем, новый ли пользователь (есть ли дата регистрации)
        database.ref(`users/${userId}/информация/дата_регистрации`).once('value').then(snapshot => {
            const createdAt = snapshot.val() || now;
            
            // Сохраняем в русской структуре
            database.ref(`users/${userId}`).set({
                "информация": {
                    "email": userEmail,
                    "имя": userName,
                    "дата_регистрации": createdAt,
                    "последний_вход": now
                },
                "игра": {
                    "алмазы": gameData.gems,
                    "серия_дней": gameData.streak,
                    "текущий_уровень": gameData.currentLevel,
                    "имя_питомца": gameData.petName
                },
                "статы": {
                    "стиль": gameData.style,
                    "ум": gameData.smartStat,
                    "уют": gameData.cozy,
                    "красота": gameData.beauty
                },
                "питомец": {
                    "сытость": gameData.pet.hunger,
                    "счастье": gameData.pet.happiness,
                    "энергия": gameData.pet.energy,
                    "чистота": gameData.pet.clean,
                    "спит_до": gameData.pet.sleepUntil,
                    "болен_до": gameData.pet.sickUntil,
                    "счётчики": {
                        "кормление": gameData.pet.feedCount,
                        "молоко": gameData.pet.milkCount,
                        "сон": gameData.pet.sleepCount,
                        "гладить": gameData.pet.petCount,
                        "игры": {
                            "клубок": gameData.pet.playCount,
                            "мячик": gameData.pet.playBallCount,
                            "лазер": gameData.pet.playLaserCount,
                            "фантик": gameData.pet.playCandyCount
                        },
                        "расчёсывание": gameData.pet.brushCount,
                        "купание": gameData.pet.batheCount,
                        "подарок": gameData.pet.giftCount,
                        "лоток": gameData.pet.litterCount
                    }
                },
                "задания": {
                    "ежедневные": Object.fromEntries(
                        Object.entries(gameData.taskStatuses)
                            .filter(([k]) => k.startsWith('daily_'))
                    ),
                    "еженедельные": Object.fromEntries(
                        Object.entries(gameData.taskStatuses)
                            .filter(([k]) => k.startsWith('weekly_'))
                    ),
                    "ежемесячные": Object.fromEntries(
                        Object.entries(gameData.taskStatuses)
                            .filter(([k]) => k.startsWith('monthly_'))
                    )
                },
                "настройки": {
                    "уведомления": gameData.notificationsEnabled,
                    "код_родителя": gameData.parentCode,
                    "режим_родителя": gameData.parentModeActive
                },
                "покупки": {
                    "аксессуары": gameData.purchasedAccessories,
                    "мебель": gameData.purchasedFurniture,
                    "декор": gameData.purchasedDecor,
                    "умные_вещи": gameData.purchasedSmart
                },
                "активные_предметы": {
                    "справа": gameData.activeRight,
                    "слева": gameData.activeLeft,
                    "сверху": gameData.activeTop,
                    "аксессуар": gameData.pet.currentAccessory
                },
                "последнее_сохранение": now
            });
        });
        
        console.log('☁️ Данные сохранены в облако (русские ключи)');
    }
}

async function loadGameFromCloud(userId) {
    if (!userId) return;
    try {
        const snapshot = await database.ref(`users/${userId}`).once('value');
        if (snapshot.exists()) {
            const cloudData = snapshot.val();
            
            // ПРОВЕРЯЕМ СТРУКТУРУ: есть ли "игра" (русские ключи)
            if (cloudData["игра"]) {
                // Русская структура
                gameData.gems = cloudData["игра"]["алмазы"] || 100;
                gameData.streak = cloudData["игра"]["серия_дней"] || 0;
                gameData.currentLevel = cloudData["игра"]["текущий_уровень"] || 0;
                gameData.petName = cloudData["игра"]["имя_питомца"] || "Мурка";
                
                if (cloudData["статы"]) {
                    gameData.style = cloudData["статы"]["стиль"] || 0;
                    gameData.smartStat = cloudData["статы"]["ум"] || 0;
                    gameData.cozy = cloudData["статы"]["уют"] || 0;
                    gameData.beauty = cloudData["статы"]["красота"] || 0;
                }
                
                if (cloudData["питомец"]) {
                    gameData.pet.hunger = cloudData["питомец"]["сытость"] || 20;
                    gameData.pet.happiness = cloudData["питомец"]["счастье"] || 50;
                    gameData.pet.energy = cloudData["питомец"]["энергия"] || 70;
                    gameData.pet.clean = cloudData["питомец"]["чистота"] || 80;
                    gameData.pet.sleepUntil = cloudData["питомец"]["спит_до"] || null;
                    gameData.pet.sickUntil = cloudData["питомец"]["болен_до"] || null;
                    
                    if (cloudData["питомец"]["счётчики"]) {
                        const c = cloudData["питомец"]["счётчики"];
                        gameData.pet.feedCount = c["кормление"] || 0;
                        gameData.pet.milkCount = c["молоко"] || 0;
                        gameData.pet.sleepCount = c["сон"] || 0;
                        gameData.pet.petCount = c["гладить"] || 0;
                        if (c["игры"]) {
                            gameData.pet.playCount = c["игры"]["клубок"] || 0;
                            gameData.pet.playBallCount = c["игры"]["мячик"] || 0;
                            gameData.pet.playLaserCount = c["игры"]["лазер"] || 0;
                            gameData.pet.playCandyCount = c["игры"]["фантик"] || 0;
                        }
                        gameData.pet.brushCount = c["расчёсывание"] || 0;
                        gameData.pet.batheCount = c["купание"] || 0;
                        gameData.pet.giftCount = c["подарок"] || 0;
                        gameData.pet.litterCount = c["лоток"] || 0;
                    }
                }
                
                if (cloudData["задания"]) {
                    Object.assign(gameData.taskStatuses, cloudData["задания"]["ежедневные"] || {});
                    Object.assign(gameData.taskStatuses, cloudData["задания"]["еженедельные"] || {});
                    Object.assign(gameData.taskStatuses, cloudData["задания"]["ежемесячные"] || {});
                }
                
                if (cloudData["настройки"]) {
                    gameData.notificationsEnabled = cloudData["настройки"]["уведомления"] || false;
                    gameData.parentCode = cloudData["настройки"]["код_родителя"] || "1234";
                    gameData.parentModeActive = cloudData["настройки"]["режим_родителя"] || false;
                }
                
                if (cloudData["покупки"]) {
                    gameData.purchasedAccessories = cloudData["покупки"]["аксессуары"] || [];
                    gameData.purchasedFurniture = cloudData["покупки"]["мебель"] || [];
                    gameData.purchasedDecor = cloudData["покупки"]["декор"] || [];
                    gameData.purchasedSmart = cloudData["покупки"]["умные_вещи"] || [];
                }
                
                if (cloudData["активные_предметы"]) {
                    gameData.activeRight = cloudData["активные_предметы"]["справа"] || null;
                    gameData.activeLeft = cloudData["активные_предметы"]["слева"] || null;
                    gameData.activeTop = cloudData["активные_предметы"]["сверху"] || null;
                    gameData.pet.currentAccessory = cloudData["активные_предметы"]["аксессуар"] || null;
                }
            } 
            // ИНАЧЕ — старая структура (прямо gameData), конвертируем в русскую
            else if (cloudData.gems !== undefined) {
                console.log('🔄 Обнаружена старая структура, конвертируем...');
                // Создаём русскую структуру из старых данных
                const converted = {
                    "игра": {
                        "алмазы": cloudData.gems || 100,
                        "серия_дней": cloudData.streak || 0,
                        "текущий_уровень": cloudData.currentLevel || 0,
                        "имя_питомца": cloudData.petName || "Мурка"
                    },
                    "статы": {
                        "стиль": cloudData.style || 0,
                        "ум": cloudData.smartStat || 0,
                        "уют": cloudData.cozy || 0,
                        "красота": cloudData.beauty || 0
                    },
                    "питомец": {
                        "сытость": cloudData.pet?.hunger || 20,
                        "счастье": cloudData.pet?.happiness || 50,
                        "энергия": cloudData.pet?.energy || 70,
                        "чистота": cloudData.pet?.clean || 80,
                        "спит_до": cloudData.pet?.sleepUntil || null,
                        "болен_до": cloudData.pet?.sickUntil || null,
                        "счётчики": {
                            "кормление": cloudData.pet?.feedCount || 0,
                            "молоко": cloudData.pet?.milkCount || 0,
                            "сон": cloudData.pet?.sleepCount || 0,
                            "гладить": cloudData.pet?.petCount || 0,
                            "игры": {
                                "клубок": cloudData.pet?.playCount || 0,
                                "мячик": cloudData.pet?.playBallCount || 0,
                                "лазер": cloudData.pet?.playLaserCount || 0,
                                "фантик": cloudData.pet?.playCandyCount || 0
                            },
                            "расчёсывание": cloudData.pet?.brushCount || 0,
                            "купание": cloudData.pet?.batheCount || 0,
                            "подарок": cloudData.pet?.giftCount || 0,
                            "лоток": cloudData.pet?.litterCount || 0
                        }
                    },
                    "задания": {
                        "ежедневные": Object.fromEntries(Object.entries(cloudData.taskStatuses || {}).filter(([k]) => k.startsWith('daily_'))),
                        "еженедельные": Object.fromEntries(Object.entries(cloudData.taskStatuses || {}).filter(([k]) => k.startsWith('weekly_'))),
                        "ежемесячные": Object.fromEntries(Object.entries(cloudData.taskStatuses || {}).filter(([k]) => k.startsWith('monthly_')))
                    },
                    "настройки": {
                        "уведомления": cloudData.notificationsEnabled || false,
                        "код_родителя": cloudData.parentCode || "1234",
                        "режим_родителя": cloudData.parentModeActive || false
                    },
                    "покупки": {
                        "аксессуары": cloudData.purchasedAccessories || [],
                        "мебель": cloudData.purchasedFurniture || [],
                        "декор": cloudData.purchasedDecor || [],
                        "умные_вещи": cloudData.purchasedSmart || []
                    },
                    "активные_предметы": {
                        "справа": cloudData.activeRight || null,
                        "слева": cloudData.activeLeft || null,
                        "сверху": cloudData.activeTop || null,
                        "аксессуар": cloudData.pet?.currentAccessory || null
                    },
                    "последнее_сохранение": new Date().toISOString().split('T')[0]
                };
                
                // Сохраняем конвертированные данные
                await database.ref(`users/${userId}`).set(converted);
                console.log('✅ Данные сконвертированы в русскую структуру');
                
                // Загружаем обратно (рекурсия)
                await loadGameFromCloud(userId);
                return;
            }
            
            // Сохраняем в localStorage
            localStorage.setItem("tamagochiPlannerFinal", JSON.stringify(gameData));
            
            // Обновляем UI
            if (typeof updateAllUI === 'function') updateAllUI();
            if (typeof renderTasks === 'function') renderTasks();
            
            showMessage(`☁️ Данные загружены из облака`);
            console.log('📥 Облачные данные загружены');
        }
    } catch (e) {
        console.log('Ошибка загрузки из облака:', e);
    }
}

// Функция для принудительной конвертации (вызвать в консоли)
window.migrateAllUsers = async function() {
    const snapshot = await database.ref('users').once('value');
    snapshot.forEach(async (child) => {
        const userId = child.key;
        const data = child.val();
        // Если нет русской структуры
        if (!data["игра"] && data.gems !== undefined) {
            console.log(`🔄 Мигрируем пользователя ${userId}...`);
            const converted = {
                "игра": {
                    "алмазы": data.gems || 100,
                    "серия_дней": data.streak || 0,
                    "текущий_уровень": data.currentLevel || 0,
                    "имя_питомца": data.petName || "Мурка"
                },
                "статы": {
                    "стиль": data.style || 0,
                    "ум": data.smartStat || 0,
                    "уют": data.cozy || 0,
                    "красота": data.beauty || 0
                },
                "питомец": {
                    "сытость": data.pet?.hunger || 20,
                    "счастье": data.pet?.happiness || 50,
                    "энергия": data.pet?.energy || 70,
                    "чистота": data.pet?.clean || 80,
                    "спит_до": data.pet?.sleepUntil || null,
                    "болен_до": data.pet?.sickUntil || null
                },
                "последнее_сохранение": new Date().toISOString().split('T')[0]
            };
            await database.ref(`users/${userId}`).update(converted);
            console.log(`✅ Пользователь ${userId} сконвертирован`);
        }
    });
    console.log('🎉 Миграция завершена!');
};