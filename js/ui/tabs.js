function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-tab'));
    const activeTab = document.getElementById(`${tabId}Tab`);
    if (activeTab) activeTab.classList.add('active-tab');
    
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    const activeTabBtn = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (activeTabBtn) activeTabBtn.classList.add('active');
    
    if (tabId === 'tasks') {
        if (typeof renderTasks === 'function') renderTasks();
    }
    if (tabId === 'pet') {
        if (typeof updatePetStats === 'function') updatePetStats();
        if (typeof updateActionLimitsDisplay === 'function') updateActionLimitsDisplay();
    }
}