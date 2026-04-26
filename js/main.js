function init() {
    if (isInitialized) {
        console.log("Инициализация уже выполнена");
        return;
    }
    isInitialized = true;
    
    loadGame();
    
    initLitterBox();
    createActionButtons();
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
            if (gameData.parentModeActive) {
                resetGame();
                updateStreakUI();
                renderLevelProgress();
                updateParentModeUI();
                updateNameUI();
                updateDateHeader();
                updatePetStats();
                recalcStats();
                updateAllUI();
                renderRoomModal();
                updateChestUI();
                updateFreeNameButtonState();
                renderTasks();
                updateActionLimitsDisplay();
                switchTab('tasks');
            } else {
                showMessage("Только в режиме родителя");
            }
        });
    }
    
    const changeCodeBtn = document.getElementById('changeCodeBtn');
    if (changeCodeBtn) {
        changeCodeBtn.addEventListener('click', () => {
            const cur = document.getElementById('currentCodeInput');
            const nw = document.getElementById('newCodeInput');
            const cf = document.getElementById('confirmCodeInput');
            if (!cur || !nw || !cf) return;
            
            if (cur.value !== gameData.parentCode) {
                showMessage(`❌ Неверный текущий код!`);
                return;
            }
            if (nw.value.length < 4 || nw.value.length > 6 || !/^\d+$/.test(nw.value)) {
                showMessage(`❌ Код 4-6 цифр!`);
                return;
            }
            if (nw.value !== cf.value) {
                showMessage(`❌ Коды не совпадают!`);
                return;
            }
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
        notifToggle.checked = gameData.notificationsEnabled;
    }
    
    const closeHintBtn = document.getElementById('closeHintBtn');
    if (closeHintBtn) {
        closeHintBtn.onclick = () => {
            const hintModal = document.getElementById('hintModal');
            if (hintModal) hintModal.classList.remove('active');
        };
    }
    
    const closeRewardBtn = document.getElementById('closeRewardBtn');
    if (closeRewardBtn) {
        closeRewardBtn.onclick = () => {
            const rewardModal = document.getElementById('rewardModal');
            if (rewardModal) rewardModal.classList.remove('active');
        };
    }

    const levelBlock = document.getElementById('headerLevelBlock');
    if (levelBlock) {
        levelBlock.addEventListener('click', openLevelsModal);
    }
    
    const levelsCloseBtn = document.getElementById('levelsCloseBtn');
    if (levelsCloseBtn) {
        levelsCloseBtn.addEventListener('click', closeLevelsModal);
    }
    
    const levelsModal = document.getElementById('levelsModal');
    if (levelsModal) {
        levelsModal.addEventListener('click', (e) => {
            if (e.target === levelsModal) closeLevelsModal();
        });
    }
    
    const detailCloseBtn = document.getElementById('levelDetailCloseBtn');
    if (detailCloseBtn) {
        const newCloseBtn = detailCloseBtn.cloneNode(true);
        detailCloseBtn.parentNode.replaceChild(newCloseBtn, detailCloseBtn);
        newCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeLevelDetail();
        });
    }
    
    const detailModal = document.getElementById('levelDetailModal');
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) closeLevelDetail();
        });
    }
    
    const instructionCloseBtn = document.getElementById('instructionCloseBtn');
    if (instructionCloseBtn) {
        instructionCloseBtn.addEventListener('click', closeLevelInstruction);
    }
    
    const instructionOkBtn = document.getElementById('instructionOkBtn');
    if (instructionOkBtn) {
        instructionOkBtn.addEventListener('click', closeLevelInstruction);
    }
    
    const instructionModal = document.getElementById('levelInstructionModal');
    if (instructionModal) {
        instructionModal.addEventListener('click', (e) => {
            if (e.target === instructionModal) closeLevelInstruction();
        });
    }

    document.body.addEventListener('touchstart', () => {
        initAudio();
        if (audioCtx?.state === 'suspended') audioCtx.resume();
    }, { once: true });
    document.body.addEventListener('click', () => {
        initAudio();
        if (audioCtx?.state === 'suspended') audioCtx.resume();
    }, { once: true });
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    setInterval(() => {
        updatePetStats();
    }, CONFIG.STATS_UPDATE_INTERVAL);
    
    // Подсказки при нажатии на статы
    initStatHints();
    
    // Отображаем версию в футере
    const footerVersion = document.getElementById('footerVersion');
    if (footerVersion) {
        const versionMeta = document.querySelector('meta[name="version"]');
        if (versionMeta) {
            footerVersion.innerText = versionMeta.getAttribute('content');
        }
    }
}

init();