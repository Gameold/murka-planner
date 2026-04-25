// Главный файл инициализации

// Флаг для предотвращения двойной инициализации
let isInitialized = false;

// Конфигурация конфетти
const canvas = document.getElementById('confettiCanvas');
let ctx = canvas?.getContext('2d');
let particles = [];

function resizeCanvas() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

function startConfetti() {
    if (!ctx) return;
    resizeCanvas();
    particles = [];
    const colors = ['#ff99cc', '#ffcc99', '#99ffcc', '#ffb3ba', '#c5e99b'];
    for (let i = 0; i < 70; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 5,
            size: Math.random() * 8 + 3,
            speedY: -Math.random() * 7 - 4,
            speedX: (Math.random() - 0.5) * 3.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * 360,
            spin: (Math.random() - 0.5) * 12
        });
    }
    if (confettiActive) return;
    confettiActive = true;
    function animate() {
        if (!confettiActive || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        for (let p of particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += 0.2;
            p.rot += p.spin;
            if (p.y < canvas.height + 50 && p.y > -50) alive = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }
        if (alive) requestAnimationFrame(animate);
        else { confettiActive = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }
    requestAnimationFrame(animate);
    setTimeout(() => { confettiActive = false; if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }, 1700);
}

function showHintModal(icon, taskName) {
    const hintText = HINTS[taskName] || "Сделай это задание!";
    const hintIcon = document.getElementById('hintIcon');
    const hintTextEl = document.getElementById('hintText');
    if (hintIcon) hintIcon.innerHTML = icon;
    if (hintTextEl) hintTextEl.innerHTML = hintText;
    const hintModal = document.getElementById('hintModal');
    if (hintModal) hintModal.classList.add('active');
}

// Функции имени
function openNameModal() {
    const nameInput = document.getElementById('newNameInput');
    if (nameInput) {
        nameInput.value = '';
        nameInput.placeholder = 'Введите новое имя';
    }
    
    updateFreeNameButtonState();
    
    const nameModal = document.getElementById('nameModal');
    if (nameModal) nameModal.classList.add('active');
}

function closeNameModal() {
    const nameModal = document.getElementById('nameModal');
    if (nameModal) nameModal.classList.remove('active');
    const nameInput = document.getElementById('newNameInput');
    if (nameInput) {
        nameInput.value = '';
        nameInput.placeholder = 'Введите новое имя';
    }
}

function updateFreeNameButtonState() {
    const freeBtn = document.getElementById('freeNameBtn');
    if (!freeBtn) return;
    
    const now = Date.now();
    const monthInMs = 30 * 24 * 60 * 60 * 1000;
    const lastChange = gameData.lastNameChange;
    
    if (lastChange && (now - lastChange) < monthInMs) {
        const daysLeft = Math.ceil((monthInMs - (now - lastChange)) / (24 * 60 * 60 * 1000));
        freeBtn.style.display = 'none';
        
        let timerText = document.getElementById('freeNameTimer');
        if (!timerText) {
            timerText = document.createElement('div');
            timerText.id = 'freeNameTimer';
            timerText.className = 'name-timer';
            const nameNote = document.getElementById('nameChangeNote');
            if (nameNote) nameNote.parentNode.insertBefore(timerText, nameNote.nextSibling);
        }
        timerText.innerHTML = `⏳ Бесплатная смена имени будет доступна через ${daysLeft} ${getDaysWord(daysLeft)}`;
        timerText.style.display = 'block';
    } else {
        freeBtn.style.display = 'block';
        const timerText = document.getElementById('freeNameTimer');
        if (timerText) timerText.style.display = 'none';
    }
}

function changeNameFree() {
    const newNameInput = document.getElementById('newNameInput');
    if (!newNameInput) return;
    const newName = newNameInput.value.trim();
    if (!newName) { 
        showMessage(`❌ Введите имя!`); 
        newNameInput.placeholder = 'Введите новое имя';
        newNameInput.focus();
        return; 
    }
    
    const now = Date.now();
    const monthInMs = 30 * 24 * 60 * 60 * 1000;
    
    if (gameData.lastNameChange && (now - gameData.lastNameChange) < monthInMs) {
        const daysLeft = Math.ceil((monthInMs - (now - gameData.lastNameChange)) / (24 * 60 * 60 * 1000));
        showMessage(`❌ Бесплатно можно сменить только через ${daysLeft} ${getDaysWord(daysLeft)}!`);
        return;
    }
    
    gameData.petName = newName;
    gameData.lastNameChange = now;
    updateNameUI();
    saveGame();
    showMessage(`✅ Теперь питомицу зовут ${newName}!`);
    playSound(880);
    closeNameModal();
}

function changeNamePaid() {
    const newNameInput = document.getElementById('newNameInput');
    if (!newNameInput) return;
    const newName = newNameInput.value.trim();
    if (!newName) { 
        showMessage(`❌ Введите имя!`); 
        newNameInput.placeholder = 'Введите новое имя';
        newNameInput.focus();
        return; 
    }
    if (gameData.gems < 100) { showMessage(`💔 Нужно 100💎 для смены имени`); return; }
    gameData.gems -= 100;
    gameData.petName = newName;
    updateNameUI();
    saveGame();
    showMessage(`✅ Теперь питомицу зовут ${newName}! (-100💎)`);
    playSound(880);
    startConfetti();
    closeNameModal();
    updateGemsUI();
}

// Родительский режим
function updateParentModeUI() {
    const bar = document.getElementById('parentModeBar');
    const resetBtnParent = document.getElementById('resetParentBtn');
    const container = document.getElementById('parentActionContainer');

    if (gameData.parentModeActive) {
        if (bar) bar.style.display = 'flex';
        if (resetBtnParent) resetBtnParent.style.display = 'block';
        if (container) {
            container.innerHTML = '<div class="parent-active-badge">🔐 Родительский режим активен</div>';
        }
        document.body.classList.add('parent-mode');
    } else {
        if (bar) bar.style.display = 'none';
        if (resetBtnParent) resetBtnParent.style.display = 'none';
        if (container) {
            container.innerHTML = '<button id="enterParentFromSettingsBtn" class="enter-parent-btn">🔐 Войти в режим родителя</button>';
            const enterBtn = document.getElementById('enterParentFromSettingsBtn');
            if (enterBtn) enterBtn.addEventListener('click', enterParentMode);
        }
        document.body.classList.remove('parent-mode');
    }
}

function enterParentMode() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content"><h3>🔐 Вход для родителя</h3><p>Введите пин-код</p><input type="password" id="parentCodeInput" class="code-input" maxlength="6" placeholder=""><div class="modal-buttons" style="display:flex; gap:8px; justify-content:center; margin-top:8px;"><button class="modal-btn confirm" id="confirmCode" style="background:#58cc71; color:white; padding:8px 20px; border:none; border-radius:40px;">Войти</button><button class="modal-btn cancel" id="cancelModal" style="background:#f0e0ea; padding:8px 20px; border:none; border-radius:40px;">Отмена</button></div></div>`;
    document.body.appendChild(modal);
    
    const confirmBtn = document.getElementById('confirmCode');
    const cancelBtn = document.getElementById('cancelModal');
    const codeInput = document.getElementById('parentCodeInput');
    
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            const code = codeInput ? codeInput.value : "";
            if (code === gameData.parentCode) {
                gameData.parentModeActive = true;
                saveGame();
                modal.remove();
                showMessage("🔓 Режим родителя активирован! Теперь можно подтверждать задания.");
                updateParentModeUI();
                renderTasks();
            } else { 
                showMessage("❌ Неверный пин-код!"); 
                modal.remove(); 
            }
        };
    }
    if (cancelBtn) cancelBtn.onclick = () => modal.remove();
    if (codeInput) codeInput.focus();
}

function exitParentMode() {
    gameData.parentModeActive = false;
    
    for (let taskId in gameData.taskStatuses) {
        const status = gameData.taskStatuses[taskId];
        if (status && status.status === 'pending_review') {
            gameData.taskStatuses[taskId] = 'pending';
        }
    }
    
    saveGame();
    updateParentModeUI();
    renderTasks();
    showMessage("👶 Вы вышли из режима родителя. Теперь можно снова отмечать задания!");
}

// Рендер заданий
function renderTasks() {
    const cont = document.getElementById('tasksContainer');
    if (!cont) return;
    cont.innerHTML = '';
    const all = getAllTasksArray();
    let activeTasks = all.filter(task => {
        const tid = `${task.type}_${task.id}`;
        const status = gameData.taskStatuses[tid];
        return status !== 'rewarded' && status !== 'skipped';
    });
    let filtered = activeTasks;
    if (currentFilter === 'daily') filtered = activeTasks.filter(t => t.type === 'daily');
    else if (currentFilter === 'weekly') filtered = activeTasks.filter(t => t.type === 'weekly');
    else if (currentFilter === 'monthly') filtered = activeTasks.filter(t => t.type === 'monthly');
    const daily = filtered.filter(t => t.type === 'daily');
    const weekly = filtered.filter(t => t.type === 'weekly');
    const monthly = filtered.filter(t => t.type === 'monthly');

    function renderSection(tasks, title, icon, badge) {
        if (!tasks.length) return;
        const sec = document.createElement('div');
        sec.className = 'task-section';
        sec.innerHTML = `<div class="section-header"><span class="section-icon">${icon}</span><span class="section-title">${title}</span><span class="section-badge">${badge}</span></div>`;
        tasks.forEach(task => {
            const tid = `${task.type}_${task.id}`;
            const state = gameData.taskStatuses[tid];
            let status = 'pending';
            let isPendingReview = false, isParentApproved = false;
            if (state) {
                if (state.status === 'pending_review') { status = 'pending_review'; isPendingReview = true; }
                else if (state.status === 'parent_approved') { status = 'parent_approved'; isParentApproved = true; }
                else if (state === 'rewarded') status = 'rewarded';
                else if (state === 'skipped') status = 'skipped';
            }
            const card = document.createElement('div');
            let statusHtml = '', cardClass = '';
            
            if (status === 'rewarded') { 
                statusHtml = '<div class="task-status circle-done"></div>'; 
                cardClass = 'completed'; 
            }
            else if (status === 'skipped') { 
                statusHtml = '<div class="task-status skipped-icon"></div>'; 
                cardClass = 'skipped'; 
            }
            else if (isPendingReview) {
                if (gameData.parentModeActive) {
                    statusHtml = `<div class="task-actions" style="display:flex; gap:8px;">
                        <div class="undo-btn" data-action="parentUndo">✗</div>
                        <div class="task-status" style="background:#58cc71; color:white; font-size:24px; cursor:pointer;" data-action="approve">✔️</div>
                    </div>`;
                } else {
                    statusHtml = `<div class="task-actions" style="display:flex; gap:8px;">
                        <div class="undo-task-btn" data-action="childUndo">✖</div>
                        <div class="task-status hourglass" data-action="callParent"></div>
                    </div>`;
                }
                cardClass = 'pending-review';
            }
            else if (isParentApproved && !gameData.parentModeActive) {
                statusHtml = '<div class="task-status diamond-ready" data-action="collect" style="background:#c0e0ff; color:#2c7da0; font-size:28px; cursor:pointer;">💎</div>';
            }
            else if (isParentApproved && gameData.parentModeActive) {
                statusHtml = `<div class="task-actions" style="display:flex; gap:8px;">
                    <div class="undo-btn" data-action="parentUndoApproved" style="background:#ff6b6b;">✗</div>
                    <div class="task-status" style="background:#c0e0ff;">💎</div>
                </div>`;
            }
            else {
                statusHtml = '<div class="task-status circle-pending" data-action="mark"></div>';
            }

            let bonus = 0;
            if (task.type === 'daily' && gameData.smartStat > 0) bonus = Math.floor(task.reward * (getRewardBonus() - 1));
            let rewardText = task.reward;
            if (task.id === "w2") rewardText = "5💎/окно (макс 3)";
            card.className = `task-card ${cardClass}`;
            if (task.required) card.classList.add('required');

            if (task.id === "w2" && status === 'pending') {
                let winCountLocal = 0;
                card.innerHTML = `<div class="task-left"><span class="task-icon" data-task-name="${task.name}">${task.icon}</span><span class="task-name">${task.name}${task.required ? '<span class="required-badge">🔒 </span>' : ''}</span><span class="task-reward">${rewardText}</span></div>
                        <div class="task-actions"><div class="window-counter"><button class="window-btn windowMinus">-</button><span class="windowCountDisplay" style="min-width:30px; text-align:center;">0</span><button class="window-btn windowPlus">+</button></div>${statusHtml}</div>`;
                const plusBtn = card.querySelector('.windowPlus'), minusBtn = card.querySelector('.windowMinus'), countSpan = card.querySelector('.windowCountDisplay'), submitArea = card.querySelector('[data-action="mark"]');
                if (plusBtn) plusBtn.onclick = (e) => { e.stopPropagation(); if (winCountLocal < 3) winCountLocal++; if (countSpan) countSpan.innerHTML = winCountLocal; };
                if (minusBtn) minusBtn.onclick = (e) => { e.stopPropagation(); if (winCountLocal > 0) winCountLocal--; if (countSpan) countSpan.innerHTML = winCountLocal; };
                if (submitArea) submitArea.onclick = (e) => { e.stopPropagation(); markTaskPendingReview(tid, task, card, winCountLocal); };
            } else {
                card.innerHTML = `<div class="task-left"><span class="task-icon" data-task-name="${task.name}">${task.icon}</span><span class="task-name">${task.name}${task.required ? '<span class="required-badge">🔒 </span>' : ''}</span><span class="task-reward">+${rewardText}${bonus ? ` +${bonus}📚` : ''}</span></div><div class="task-actions">${statusHtml}</div>`;
            }

            const iconSpan = card.querySelector('.task-icon');
            if (iconSpan) iconSpan.onclick = (e) => { e.stopPropagation(); showHintModal(task.icon, task.name); };

            const markBtn = card.querySelector('[data-action="mark"]');
            if (markBtn && status === 'pending' && task.id !== "w2") {
                markBtn.onclick = (e) => { 
                    e.stopPropagation(); 
                    if (gameData.parentModeActive) {
                        showMessage("👨‍👩‍👧 В режиме родителя вы можете только подтверждать или отклонять задания");
                        return;
                    }
                    markTaskPendingReview(tid, task, card, 0); 
                };
            }

            const callParentBtn = card.querySelector('[data-action="callParent"]');
            if (callParentBtn) callParentBtn.onclick = (e) => { e.stopPropagation(); enterParentMode(); };

            const approveBtn = card.querySelector('[data-action="approve"]');
            if (approveBtn) approveBtn.onclick = (e) => { e.stopPropagation(); parentApproveTask(tid, task); };

            const parentUndoBtn = card.querySelector('[data-action="parentUndo"]');
            if (parentUndoBtn) parentUndoBtn.onclick = (e) => { e.stopPropagation(); parentUndoTask(tid); };

            const childUndoBtn = card.querySelector('[data-action="childUndo"]');
            if (childUndoBtn) childUndoBtn.onclick = (e) => { e.stopPropagation(); childUndoTask(tid); };

            const collectBtn = card.querySelector('[data-action="collect"]');
            if (collectBtn) collectBtn.onclick = (e) => { e.stopPropagation(); childCollectReward(tid, task); };

            const parentUndoApprovedBtn = card.querySelector('[data-action="parentUndoApproved"]');
            if (parentUndoApprovedBtn) {
                parentUndoApprovedBtn.onclick = (e) => { 
                    e.stopPropagation(); 
                    parentUndoApprovedTask(tid); 
                };
            }

            sec.appendChild(card);
        });
        cont.appendChild(sec);
    }
    renderSection(weekly, 'Еженедельные', '📅', 'раз в неделю');
    renderSection(monthly, 'Ежемесячные', '🌙', 'раз в месяц');
    renderSection(daily, 'Ежедневные', '⭐', 'каждый день');

    const dailyRewarded = Object.keys(gameData.taskStatuses).filter(k => k.startsWith('daily_') && gameData.taskStatuses[k] === 'rewarded').length;
    const dayProgress = document.getElementById('dayProgress');
    if (dayProgress) dayProgress.innerHTML = `${dailyRewarded}/${ALL_TASKS.daily.length}`;
    updateChestUI();
}

// Переключение вкладок
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-tab'));
    const activeTab = document.getElementById(`${tabId}Tab`);
    if (activeTab) activeTab.classList.add('active-tab');
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    const activeTabBtn = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (activeTabBtn) activeTabBtn.classList.add('active');
    if (tabId === 'tasks') renderTasks();
    if (tabId === 'pet') updatePetStats();
}

// Комната
function openRoom() {
    renderRoomModal();
    const roomModal = document.getElementById('roomModal');
    if (roomModal) roomModal.classList.add('active');
}
function closeRoom() { 
    const roomModal = document.getElementById('roomModal');
    if (roomModal) roomModal.classList.remove('active'); 
}

function onCatClick() { playMeow(); }

// Функции для модального окна уровней
function openLevelsModal() {
    const modal = document.getElementById('levelsModal');
    if (!modal) return;
    
    renderLevelsList();
    
    modal.classList.add('active');
}

function closeLevelsModal() {
    const modal = document.getElementById('levelsModal');
    if (modal) modal.classList.remove('active');
}

function openLevelDetail(levelIndex) {
    const level = LEVELS[levelIndex];
    const currentDays = gameData.streak || 0;
    const isCurrent = levelIndex === getCurrentLevelIndex();
    const isUnlocked = currentDays >= level.minDays;
    
    const modal = document.getElementById('levelDetailModal');
    if (!modal) return;
    
    // Заполняем данные
    document.getElementById('levelDetailIcon').innerHTML = level.emojiBig || level.emoji;
    document.getElementById('levelDetailName').innerHTML = level.name;
    
    const daysText = level.minDays === 0 ? 'Старт' : `${level.minDays} день`;
    document.getElementById('levelDetailDays').innerHTML = daysText;
    
    // Бонус
    let bonusText = '';
    if (level.bonusMultiplier === 0.7) bonusText = '−30% к расходу статов';
    else if (level.bonusMultiplier === 0.85) bonusText = '−15% к расходу статов';
    else if (level.bonusMultiplier === 1.0) bonusText = 'Стандартный режим';
    else if (level.bonusMultiplier === 1.2) bonusText = '+20% к эффективности';
    else if (level.bonusMultiplier === 1.5) bonusText = '+50% к эффективности';
    document.getElementById('levelDetailBonus').innerHTML = bonusText;
    
    // Игры
    const gameNames = {
        'yarn': '🧶 Клубок',
        'ball': '⚽ Мячик',
        'laser': '🔴 Лазер',
        'candy': '🍬 Фантик'
    };
    const gamesContainer = document.getElementById('levelDetailGames');
    gamesContainer.innerHTML = '';
    level.unlockGames.forEach(game => {
        const gameEl = document.createElement('div');
        gameEl.className = 'level-detail-game';
        gameEl.innerHTML = gameNames[game] || game;
        gamesContainer.appendChild(gameEl);
    });
    
    // Статус
    const statusEl = document.getElementById('levelDetailStatus');
    if (isCurrent) {
        statusEl.innerHTML = '⭐ ТЕКУЩИЙ УРОВЕНЬ ⭐';
        statusEl.className = 'level-detail-status current';
    } else if (isUnlocked) {
        statusEl.innerHTML = '✅ УРОВЕНЬ ПРОЙДЕН ✅';
        statusEl.className = 'level-detail-status unlocked';
    } else {
        const daysToUnlock = level.minDays - currentDays;
        statusEl.innerHTML = `🔒 Откроется через ${daysToUnlock} ${getDaysWord(daysToUnlock)}`;
        statusEl.className = 'level-detail-status locked';
    }
    
    // Следующий уровень
    const nextLevel = LEVELS[levelIndex + 1];
    const nextEl = document.getElementById('levelDetailNext');
    if (nextLevel && !isCurrent) {
        nextEl.innerHTML = `✨ Следующий уровень: ${nextLevel.name} (${nextLevel.minDays} дней) ✨`;
    } else if (isCurrent && nextLevel) {
        const daysToNext = nextLevel.minDays - currentDays;
        if (daysToNext > 0) {
            nextEl.innerHTML = `📈 До ${nextLevel.name}: ${daysToNext} ${getDaysWord(daysToNext)}`;
        } else {
            nextEl.innerHTML = `🌟 Ты достигла максимального уровня! 🌟`;
        }
    } else {
        nextEl.innerHTML = `👑 Ты покорила все уровни! 👑`;
    }
    
    modal.classList.add('active');
}

function closeLevelDetail() {
    const modal = document.getElementById('levelDetailModal');
    if (modal) modal.classList.remove('active');
}

function renderLevelsList() {
    const container = document.getElementById('levelsList');
    if (!container) return;
    
    const currentDays = gameData.streak || 0;
    const currentLevelIndex = getCurrentLevelIndex();
    
    container.innerHTML = '';
    
    LEVELS.forEach((level, index) => {
        const isCurrent = index === currentLevelIndex;
        const isUnlocked = currentDays >= level.minDays;
        const daysToUnlock = isUnlocked ? 0 : level.minDays - currentDays;
        
        const gameNames = {
            'yarn': '🧶 Клубок',
            'ball': '⚽ Мячик',
            'laser': '🔴 Лазер',
            'candy': '🍬 Фантик'
        };
        
        const gamesList = level.unlockGames.map(g => gameNames[g] || g).join(', ');
        
        const card = document.createElement('div');
        card.className = `level-card ${isCurrent ? 'current' : ''}`;
        card.style.cursor = 'pointer';
        
        let bonusText = '';
        if (level.bonusMultiplier === 0.7) bonusText = '−30% к расходу статов';
        else if (level.bonusMultiplier === 0.85) bonusText = '−15% к расходу статов';
        else if (level.bonusMultiplier === 1.0) bonusText = 'Стандартный режим';
        else if (level.bonusMultiplier === 1.2) bonusText = '+20% к эффективности';
        else if (level.bonusMultiplier === 1.5) bonusText = '+50% к эффективности';
        
        card.innerHTML = `
            <div class="level-header">
                <div class="level-icon">${level.emojiBig || level.emoji}</div>
                <div class="level-name">${level.name}</div>
                <div class="level-days">${level.minDays === 0 ? 'Старт' : `${level.minDays} дн.`}</div>
            </div>
            <div class="level-bonus">
                <span>🎁 Бонус:</span>
                <span>${bonusText}</span>
            </div>
            <div class="level-games">
                <span>🎮 Игры:</span>
                <span class="games-icons">${gamesList || '🧶 Клубок'}</span>
            </div>
            ${!isUnlocked ? `<div class="current-badge" style="background:#e0d0dc; color:#a57388;">🔒 Откроется через ${daysToUnlock} ${getDaysWord(daysToUnlock)}</div>` : ''}
            ${isCurrent ? '<div class="current-badge">⭐ ТЕКУЩИЙ ⭐</div>' : ''}
        `;
        
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            openLevelDetail(index);
        });
        
        container.appendChild(card);
    });
}

function initLevelsClick() {
    const levelBlock = document.getElementById('headerLevelBlock');
    if (levelBlock) {
        levelBlock.addEventListener('click', openLevelsModal);
    }
    
    const closeBtn = document.getElementById('levelsCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLevelsModal);
    }
    
    const modal = document.getElementById('levelsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeLevelsModal();
        });
    }
    
    // ПРОСТОЕ ЗАКРЫТИЕ ДЕТАЛЬНОГО ОКНА - без cloneNode
    const detailCloseBtn = document.getElementById('levelDetailCloseBtn');
    if (detailCloseBtn) {
        // Удаляем старые обработчики
        const newCloseBtn = detailCloseBtn.cloneNode(true);
        detailCloseBtn.parentNode.replaceChild(newCloseBtn, detailCloseBtn);
        newCloseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeLevelDetail();
        });
    }
    
    // Закрытие по клику на фон
    const detailModal = document.getElementById('levelDetailModal');
    if (detailModal) {
        detailModal.addEventListener('click', function(e) {
            if (e.target === detailModal) {
                closeLevelDetail();
            }
        });
    }
}

// Функция для привязки обработчика кнопки сна
function bindSleepButtonHandler() {
    const sleepBtn = document.getElementById('actionSleep');
    if (sleepBtn) {
        const newBtn = sleepBtn.cloneNode(true);
        sleepBtn.parentNode.replaceChild(newBtn, sleepBtn);
        newBtn.id = 'actionSleep';
        newBtn.addEventListener('click', () => {
            if (isSleeping()) {
                forceWakeUp();
            } else {
                sleepCat();
            }
        });
    }
}

// Инициализация
function init() {
    if (isInitialized) {
        console.log("Инициализация уже выполнена");
        return;
    }
    isInitialized = true;
    
    loadGame();
    
    initLitterBox();
    updateStreakUI();
    renderLevelProgress();
    renderLitterButton();
    updateParentModeUI();
    updateNameUI();
    updateDateHeader();
    checkAndResetTasks();
    updatePetStats();
    recalcStats();
    updateAllUI();
    renderRoomModal();
    updateChestUI();
    updateFreeNameButtonState();
    
    bindSleepButtonHandler();

    // События
    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    const petAvatar = document.getElementById('petAvatar');
    if (petAvatar) petAvatar.addEventListener('click', onCatClick);
    
    const editNameBtn = document.getElementById('editNameBtn');
    if (editNameBtn) editNameBtn.addEventListener('click', openNameModal);
    
    const freeNameBtn = document.getElementById('freeNameBtn');
    if (freeNameBtn) freeNameBtn.addEventListener('click', changeNameFree);
    
    const paidNameBtn = document.getElementById('paidNameBtn');
    if (paidNameBtn) paidNameBtn.addEventListener('click', changeNamePaid);
    
    const cancelNameBtn = document.getElementById('cancelNameBtn');
    if (cancelNameBtn) cancelNameBtn.addEventListener('click', closeNameModal);
    
    const actionFeed = document.getElementById('actionFeed');
    if (actionFeed) actionFeed.addEventListener('click', feedPet);
    
    const actionMilk = document.getElementById('actionMilk');
    if (actionMilk) actionMilk.addEventListener('click', giveMilk);
    
    const actionMedicine = document.getElementById('actionMedicine');
    if (actionMedicine) actionMedicine.addEventListener('click', giveMedicine);
    
    const actionPet = document.getElementById('actionPet');
    if (actionPet) actionPet.addEventListener('click', petCat);
    
    const actionPlayYarn = document.getElementById('actionPlayYarn');
    if (actionPlayYarn) actionPlayYarn.addEventListener('click', () => playWithCat('yarn'));
    
    const actionPlayBall = document.getElementById('actionPlayBall');
    if (actionPlayBall) actionPlayBall.addEventListener('click', () => playWithCat('ball'));
    
    const actionPlayLaser = document.getElementById('actionPlayLaser');
    if (actionPlayLaser) actionPlayLaser.addEventListener('click', () => playWithCat('laser'));
    
    const actionPlayCandy = document.getElementById('actionPlayCandy');
    if (actionPlayCandy) actionPlayCandy.addEventListener('click', () => playWithCat('candy'));
    
    const actionBrush = document.getElementById('actionBrush');
    if (actionBrush) actionBrush.addEventListener('click', brushCat);
    
    const actionBathe = document.getElementById('actionBathe');
    if (actionBathe) actionBathe.addEventListener('click', batheCat);
    
    const actionGift = document.getElementById('actionGift');
    if (actionGift) actionGift.addEventListener('click', giveGift);
    
    const openRoomBtn = document.getElementById('openRoomBtn');
    if (openRoomBtn) openRoomBtn.addEventListener('click', openRoom);
    
    const closeRoomX = document.getElementById('closeRoomX');
    if (closeRoomX) closeRoomX.addEventListener('click', closeRoom);
    
    const chestHeaderBtn = document.getElementById('chestHeaderBtn');
    if (chestHeaderBtn) chestHeaderBtn.addEventListener('click', openRewardModal);
    
    const exitParentModeBtn = document.getElementById('exitParentModeBtn');
    if (exitParentModeBtn) exitParentModeBtn.addEventListener('click', exitParentMode);
    
    const resetParentBtn = document.getElementById('resetParentBtn');
    if (resetParentBtn) {
        resetParentBtn.addEventListener('click', () => {
            if (gameData.parentModeActive) resetGame();
            else showMessage("Только в режиме родителя");
        });
    }
    
    const changeCodeBtn = document.getElementById('changeCodeBtn');
    if (changeCodeBtn) {
        changeCodeBtn.addEventListener('click', () => {
            const cur = document.getElementById('currentCodeInput');
            const nw = document.getElementById('newCodeInput');
            const cf = document.getElementById('confirmCodeInput');
            if (!cur || !nw || !cf) return;
            
            if (cur.value !== gameData.parentCode) { showMessage(`❌ Неверный текущий код!`); return; }
            if (nw.value.length < 4 || nw.value.length > 6 || !/^\d+$/.test(nw.value)) { showMessage(`❌ Код 4-6 цифр!`); return; }
            if (nw.value !== cf.value) { showMessage(`❌ Коды не совпадают!`); return; }
            gameData.parentCode = nw.value;
            saveGame();
            showMessage(`✅ Код изменён! Новый: ${nw.value}`);
            cur.value = '';
            nw.value = '';
            cf.value = '';
        });
    }
    
    const notifToggle = document.getElementById('notifToggle');
    if (notifToggle) {
        notifToggle.addEventListener('change', (e) => {
            gameData.notificationsEnabled = e.target.checked;
            saveGame();
            if (gameData.notificationsEnabled && Notification.permission === "default") {
                Notification.requestPermission();
            }
        });
    }
    
    const closeHintBtn = document.getElementById('closeHintBtn');
    if (closeHintBtn) closeHintBtn.onclick = () => {
        const hintModal = document.getElementById('hintModal');
        if (hintModal) hintModal.classList.remove('active');
    };
    
    const closeRewardBtn = document.getElementById('closeRewardBtn');
    if (closeRewardBtn) closeRewardBtn.onclick = () => {
        const rewardModal = document.getElementById('rewardModal');
        if (rewardModal) rewardModal.classList.remove('active');
    };

    initLevelsClick();

    document.body.addEventListener('touchstart', () => { initAudio(); if (audioCtx?.state === 'suspended') audioCtx.resume(); }, { once: true });
    document.body.addEventListener('click', () => { initAudio(); if (audioCtx?.state === 'suspended') audioCtx.resume(); }, { once: true });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setInterval(() => { updatePetStats(); }, 1000);
}

// Переопределяем updateActionLimitsDisplay чтобы добавить привязку кнопки сна
const originalUpdateActionLimitsDisplay = updateActionLimitsDisplay;
window.updateActionLimitsDisplay = function() {
    originalUpdateActionLimitsDisplay();
    bindSleepButtonHandler();
};
updateActionLimitsDisplay = window.updateActionLimitsDisplay;

// Запуск
init();