function updateParentModeUI() {
    const bar = document.getElementById('parentModeBar');
    const resetBtnParent = document.getElementById('resetParentBtn');
    const container = document.getElementById('parentActionContainer');

    if (gameData.parentModeActive) {
        if (bar) bar.style.display = 'flex';
        if (resetBtnParent) resetBtnParent.style.display = 'block';
        if (container) {
            container.innerHTML = '<div class="parent-active-badge">🔐 Родительский режим</div>';
        }
        document.body.classList.add('parent-mode');
    } else {
        if (bar) bar.style.display = 'none';
        if (resetBtnParent) resetBtnParent.style.display = 'none';
        if (container) {
            container.innerHTML = '<button id="enterParentFromSettingsBtn" class="enter-parent-btn">🔐 Войти в режим родителя</button>';
            const enterBtn = document.getElementById('enterParentFromSettingsBtn');
            if (enterBtn && !enterBtn.hasClickHandler) {
                enterBtn.addEventListener('click', enterParentMode);
                enterBtn.hasClickHandler = true;
            }
        }
        document.body.classList.remove('parent-mode');
    }
}

function enterParentMode() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🔐 Вход для родителя</h3>
            <p>Введите пин-код</p>
            <input type="password" id="parentCodeInput" class="code-input" maxlength="6" placeholder="">
            <div class="modal-buttons" style="display:flex; gap:8px; justify-content:center; margin-top:8px;">
                <button class="modal-btn confirm" id="confirmCode" style="background:#58cc71; color:white; padding:8px 20px; border:none; border-radius:40px;">Войти</button>
                <button class="modal-btn cancel" id="cancelModal" style="background:#f0e0ea; padding:8px 20px; border:none; border-radius:40px;">Отмена</button>
            </div>
        </div>
    `;
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
                showMessage("🔓 Режим родителя активирован");
                updateParentModeUI();
                if (typeof renderTasks === 'function') renderTasks();
                if (typeof updateActionLimitsDisplay === 'function') updateActionLimitsDisplay();
                if (typeof updatePetBars === 'function') updatePetBars();
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
    if (typeof renderTasks === 'function') renderTasks();
    if (typeof updateActionLimitsDisplay === 'function') updateActionLimitsDisplay();
    if (typeof updatePetBars === 'function') updatePetBars();
    showMessage("👶 Режим игры активирован");
}