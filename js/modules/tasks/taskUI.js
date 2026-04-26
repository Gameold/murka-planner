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
                if (state.status === 'pending_review') {
                    status = 'pending_review';
                    isPendingReview = true;
                } else if (state.status === 'parent_approved') {
                    status = 'parent_approved';
                    isParentApproved = true;
                } else if (state === 'rewarded') status = 'rewarded';
                else if (state === 'skipped') status = 'skipped';
            }
            
            const card = document.createElement('div');
            let statusHtml = '', cardClass = '';
            
            if (status === 'rewarded') {
                statusHtml = '<div class="task-status circle-done"></div>';
                cardClass = 'completed';
            } else if (status === 'skipped') {
                statusHtml = '<div class="task-status skipped-icon"></div>';
                cardClass = 'skipped';
            } else if (isPendingReview) {
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
            } else if (isParentApproved && !gameData.parentModeActive) {
                statusHtml = '<div class="task-status diamond-ready" data-action="collect" style="background:#c0e0ff; color:#2c7da0; font-size:28px; cursor:pointer;">💎</div>';
            } else if (isParentApproved && gameData.parentModeActive) {
                statusHtml = `<div class="task-actions" style="display:flex; gap:8px;">
                    <div class="undo-btn" data-action="parentUndoApproved" style="background:#ff6b6b;">✗</div>
                    <div class="task-status" style="background:#c0e0ff;">💎</div>
                </div>`;
            } else {
                statusHtml = '<div class="task-status circle-pending" data-action="mark"></div>';
            }

            let bonus = 0;
            if (task.type === 'daily' && gameData.smartStat > 0) {
                bonus = Math.floor(task.reward * (getRewardBonus() - 1));
            }
            
            let rewardText = task.reward;
            if (task.id === "w2") rewardText = "5💎/окно (макс 3)";
            
            card.className = `task-card ${cardClass}`;
            if (task.required) card.classList.add('required');

            if (task.id === "w2" && status === 'pending') {
                let winCountLocal = 0;
                card.innerHTML = `<div class="task-left">
                    <span class="task-icon" data-task-name="${task.name}">${task.icon}</span>
                    <span class="task-name">${task.name}${task.required ? '<span class="required-badge">🔒 </span>' : ''}</span>
                    <span class="task-reward">${rewardText}</span>
                </div>
                <div class="task-actions">
                    <div class="window-counter">
                        <button class="window-btn windowMinus">-</button>
                        <span class="windowCountDisplay" style="min-width:30px; text-align:center;">0</span>
                        <button class="window-btn windowPlus">+</button>
                    </div>
                    ${statusHtml}
                </div>`;
                
                const plusBtn = card.querySelector('.windowPlus');
                const minusBtn = card.querySelector('.windowMinus');
                const countSpan = card.querySelector('.windowCountDisplay');
                const submitArea = card.querySelector('[data-action="mark"]');
                
                if (plusBtn) {
                    plusBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (winCountLocal < 3) winCountLocal++;
                        if (countSpan) countSpan.innerHTML = winCountLocal;
                    };
                }
                if (minusBtn) {
                    minusBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (winCountLocal > 0) winCountLocal--;
                        if (countSpan) countSpan.innerHTML = winCountLocal;
                    };
                }
                if (submitArea) {
                    submitArea.onclick = (e) => {
                        e.stopPropagation();
                        markTaskPendingReview(tid, task, card, winCountLocal);
                    };
                }
            } else {
                card.innerHTML = `<div class="task-left">
                    <span class="task-icon" data-task-name="${task.name}">${task.icon}</span>
                    <span class="task-name">${task.name}${task.required ? '<span class="required-badge">🔒 </span>' : ''}</span>
                    <span class="task-reward">+${rewardText}${bonus ? ` +${bonus}📚` : ''}</span>
                </div>
                <div class="task-actions">${statusHtml}</div>`;
            }

            const iconSpan = card.querySelector('.task-icon');
            if (iconSpan) {
                iconSpan.onclick = (e) => {
                    e.stopPropagation();
                    showHintModal(task.icon, task.name);
                };
            }

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
            if (callParentBtn) {
                callParentBtn.onclick = (e) => {
                    e.stopPropagation();
                    enterParentMode();
                };
            }

            const approveBtn = card.querySelector('[data-action="approve"]');
            if (approveBtn) {
                approveBtn.onclick = (e) => {
                    e.stopPropagation();
                    parentApproveTask(tid, task);
                };
            }

            const parentUndoBtn = card.querySelector('[data-action="parentUndo"]');
            if (parentUndoBtn) {
                parentUndoBtn.onclick = (e) => {
                    e.stopPropagation();
                    parentUndoTask(tid);
                };
            }

            const childUndoBtn = card.querySelector('[data-action="childUndo"]');
            if (childUndoBtn) {
                childUndoBtn.onclick = (e) => {
                    e.stopPropagation();
                    childUndoTask(tid);
                };
            }

            const collectBtn = card.querySelector('[data-action="collect"]');
            if (collectBtn) {
                collectBtn.onclick = (e) => {
                    e.stopPropagation();
                    childCollectReward(tid, task);
                };
            }

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

function showHintModal(icon, taskName) {
    const hintText = HINTS[taskName] || "Сделай это задание!";
    const hintIcon = document.getElementById('hintIcon');
    const hintTextEl = document.getElementById('hintText');
    if (hintIcon) hintIcon.innerHTML = icon;
    if (hintTextEl) hintTextEl.innerHTML = hintText;
    const hintModal = document.getElementById('hintModal');
    if (hintModal) hintModal.classList.add('active');
}