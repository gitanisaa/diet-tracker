const TOTAL_DAYS = 30;
let selectedDay = null;

let trackerData = JSON.parse(localStorage.getItem('fatLossData')) || {
    startWeight: '',
    goalWeight: '',
    days: {}
};

const startWeightInput = document.getElementById('start-weight');
const goalWeightInput = document.getElementById('goal-weight');
const currentWeightDisplay = document.getElementById('current-weight');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const progressBar = document.getElementById('progress-bar');
const grid = document.getElementById('grid');
const modal = document.getElementById('modal');

const btnClose = document.getElementById('btn-close');
const btnCancel = document.getElementById('btn-cancel');
const btnSave = document.getElementById('btn-save');
const btnClear = document.getElementById('btn-clear');

function init() {
    startWeightInput.value = trackerData.startWeight || '';
    goalWeightInput.value = trackerData.goalWeight || '';

    startWeightInput.addEventListener('change', () => {
        trackerData.startWeight = startWeightInput.value ? parseFloat(startWeightInput.value) : '';
        saveData();
        updateHeader();
    });

    goalWeightInput.addEventListener('change', () => {
        trackerData.goalWeight = goalWeightInput.value ? parseFloat(goalWeightInput.value) : '';
        saveData();
    });

    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    btnSave.addEventListener('click', saveDayData);
    btnClear.addEventListener('click', clearDayData);

    renderGrid();
    updateHeader();
    updateProgress();
}

function saveData() {
    localStorage.setItem('fatLossData', JSON.stringify(trackerData));
}

function renderGrid() {
    grid.innerHTML = '';
    for (let i = 1; i <= TOTAL_DAYS; i++) {
        const dayData = trackerData.days[i];
        const card = document.createElement('div');
        card.className = 'day-card';
        
        const isLogged = dayData && Object.keys(dayData).some(k => dayData[k] !== '' && dayData[k] !== null);
        if (isLogged) card.classList.add('logged');

        let weightBadge = '';
        if (dayData && dayData.weight) {
            card.classList.add('has-weight');
            weightBadge = `<div class="badge-weight">${dayData.weight}kg</div>`;
        }

        let summaryHtml = '';
        if (dayData) {
            if (dayData.calories) summaryHtml += `<div>🔥 ${dayData.calories} kcal</div>`;
            if (dayData.protein) summaryHtml += `<div>🥩 ${dayData.protein}g</div>`;
        }

        card.innerHTML = `
            ${weightBadge}
            <div class="day-number">Day ${i}</div>
            <div class="day-summary">${summaryHtml}</div>
        `;

        card.onclick = () => openModal(i);
        grid.appendChild(card);
    }
}

function updateHeader() {
    let latestWeight = trackerData.startWeight;
    
    for (let i = 1; i <= TOTAL_DAYS; i++) {
        if (trackerData.days[i] && trackerData.days[i].weight) {
            latestWeight = trackerData.days[i].weight;
        }
    }

    currentWeightDisplay.textContent = latestWeight ? `${latestWeight} kg` : '--';
}

function updateProgress() {
    let loggedCount = 0;
    for (let i = 1; i <= TOTAL_DAYS; i++) {
        const day = trackerData.days[i];
        if (day && Object.keys(day).some(k => day[k] !== '' && day[k] !== null)) {
            loggedCount++;
        }
    }

    progressText.textContent = `${loggedCount} of ${TOTAL_DAYS} Days Completed`;
    const percentage = Math.round((loggedCount / TOTAL_DAYS) * 100);
    progressPercent.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
}

function openModal(day) {
    selectedDay = day;
    document.getElementById('modal-title').textContent = `Day ${day}`;
    
    const dayData = trackerData.days[day] || {};
    document.getElementById('input-calories').value = dayData.calories || '';
    document.getElementById('input-protein').value = dayData.protein || '';
    document.getElementById('input-walk').value = dayData.walk || '';
    document.getElementById('input-burn').value = dayData.burn || '';
    document.getElementById('input-weight').value = dayData.weight || '';

    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    selectedDay = null;
}

function saveDayData() {
    if (!selectedDay) return;

    const calories = document.getElementById('input-calories').value;
    const protein = document.getElementById('input-protein').value;
    const walk = document.getElementById('input-walk').value;
    const burn = document.getElementById('input-burn').value;
    const weight = document.getElementById('input-weight').value;

    trackerData.days[selectedDay] = {
        calories: calories ? parseFloat(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        walk: walk ? parseFloat(walk) : null,
        burn: burn ? parseFloat(burn) : null,
        weight: weight ? parseFloat(weight) : null
    };

    saveData();
    renderGrid();
    updateHeader();
    updateProgress();
    closeModal();
}

function clearDayData() {
    if (!selectedDay) return;
    delete trackerData.days[selectedDay];
    saveData();
    renderGrid();
    updateHeader();
    updateProgress();
    closeModal();
}

document.addEventListener('DOMContentLoaded', init);
