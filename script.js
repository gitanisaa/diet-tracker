const TOTAL_DAYS = 30;
let selectedDay = null;
let currentWater = 0;

let currentExerciseName = '';
let modalGymChart = null;
let modalTreadmillChart = null;

let trackerData = JSON.parse(localStorage.getItem('fatLossData')) || {
    startWeight: '',
    goalWeight: '',
    days: {},
    gymLogs: {},
    treadmillLogs: []
};

// DOM Elements
const tabFatlossBtn = document.getElementById('tab-fatloss-btn');
const tabGymBtn = document.getElementById('tab-gym-btn');
const fatlossSection = document.getElementById('fatloss-section');
const gymSection = document.getElementById('gym-section');

const startWeightInput = document.getElementById('start-weight');
const goalWeightInput = document.getElementById('goal-weight');
const currentWeightDisplay = document.getElementById('current-weight');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const progressBar = document.getElementById('progress-bar');
const grid = document.getElementById('grid');
const modal = document.getElementById('modal');

const inputCalories = document.getElementById('input-calories');
const inputBurn = document.getElementById('input-burn');
const deficitValue = document.getElementById('deficit-value');
const waterDisplay = document.getElementById('water-display');

// Gym & Treadmill Modals
const gymModal = document.getElementById('gym-modal');
const gymModalTitle = document.getElementById('gym-modal-title');
const treadmillModal = document.getElementById('treadmill-modal');

function init() {
    startWeightInput.value = trackerData.startWeight || '';
    goalWeightInput.value = trackerData.goalWeight || '';

    tabFatlossBtn.addEventListener('click', () => switchTab('fatloss'));
    tabGymBtn.addEventListener('click', () => switchTab('gym'));

    startWeightInput.addEventListener('change', () => {
        trackerData.startWeight = startWeightInput.value ? parseFloat(startWeightInput.value) : '';
        saveData();
        updateHeader();
    });

    goalWeightInput.addEventListener('change', () => {
        trackerData.goalWeight = goalWeightInput.value ? parseFloat(goalWeightInput.value) : '';
        saveData();
    });

    inputCalories.addEventListener('input', calculateDeficit);
    inputBurn.addEventListener('input', calculateDeficit);

    document.getElementById('btn-water-plus').addEventListener('click', () => updateWater(250));
    document.getElementById('btn-water-minus').addEventListener('click', () => updateWater(-250));

    document.getElementById('btn-close').addEventListener('click', closeModal);
    document.getElementById('btn-cancel').addEventListener('click', closeModal);
    document.getElementById('btn-save').addEventListener('click', saveDayData);
    document.getElementById('btn-clear').addEventListener('click', clearDayData);

    // Exercise Click Listener
    document.querySelectorAll('.clickable-exercise').forEach(item => {
        item.addEventListener('click', () => {
            const exercise = item.getAttribute('data-exercise');
            const type = item.getAttribute('data-type');
            
            if (type === 'treadmill') {
                openTreadmillModal();
            } else {
                openGymModal(exercise);
            }
        });
    });

    document.getElementById('gym-modal-close').addEventListener('click', () => gymModal.classList.remove('active'));
    document.getElementById('treadmill-modal-close').addEventListener('click', () => treadmillModal.classList.remove('active'));

    document.getElementById('btn-save-gym-modal').addEventListener('click', saveGymModalLog);
    document.getElementById('btn-save-tm-modal').addEventListener('click', saveTreadmillModalLog);

    renderGrid();
    updateHeader();
    updateProgress();
    initModalGymChart();
    initModalTreadmillChart();
}

function switchTab(tab) {
    if (tab === 'fatloss') {
        tabFatlossBtn.classList.add('active');
        tabGymBtn.classList.remove('active');
        fatlossSection.classList.add('active');
        gymSection.classList.remove('active');
    } else {
        tabGymBtn.classList.add('active');
        tabFatlossBtn.classList.remove('active');
        gymSection.classList.add('active');
        fatlossSection.classList.remove('active');
    }
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
            if (dayData.water) summaryHtml += `<div>💧 ${dayData.water} ml</div>`;
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
    inputCalories.value = dayData.calories || '';
    document.getElementById('input-protein').value = dayData.protein || '';
    document.getElementById('input-walk').value = dayData.walk || '';
    inputBurn.value = dayData.burn || '';
    document.getElementById('input-weight').value = dayData.weight || '';
    
    currentWater = dayData.water || 0;
    waterDisplay.textContent = `${currentWater} ml`;

    calculateDeficit();
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    selectedDay = null;
}

function calculateDeficit() {
    const eaten = parseFloat(inputCalories.value) || 0;
    const burned = parseFloat(inputBurn.value) || 0;
    const tdee = 1700;
    const totalOut = tdee + burned;
    const deficit = totalOut - eaten;

    deficitValue.textContent = `${deficit > 0 ? '-' + deficit : '+' + Math.abs(deficit)} kcal`;
    deficitValue.style.color = deficit >= 0 ? '#01b574' : '#ee5d50';
}

function updateWater(amount) {
    currentWater = Math.max(0, currentWater + amount);
    waterDisplay.textContent = `${currentWater} ml`;
}

function saveDayData() {
    if (!selectedDay) return;

    trackerData.days[selectedDay] = {
        calories: inputCalories.value ? parseFloat(inputCalories.value) : null,
        protein: document.getElementById('input-protein').value ? parseFloat(document.getElementById('input-protein').value) : null,
        walk: document.getElementById('input-walk').value ? parseFloat(document.getElementById('input-walk').value) : null,
        burn: inputBurn.value ? parseFloat(inputBurn.value) : null,
        weight: document.getElementById('input-weight').value ? parseFloat(document.getElementById('input-weight').value) : null,
        water: currentWater
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

/* Gym Exercise Modal & Chart */
function openGymModal(exercise) {
    currentExerciseName = exercise;
    gymModalTitle.textContent = exercise;
    gymModal.classList.add('active');
    updateModalGymChart();
}

function saveGymModalLog() {
    const date = document.getElementById('modal-gym-date').value || `Sesi ${(trackerData.gymLogs[currentExerciseName] || []).length + 1}`;
    const sets = parseInt(document.getElementById('modal-gym-sets').value) || 3;
    const reps = parseInt(document.getElementById('modal-gym-reps').value) || 0;
    const weight = parseFloat(document.getElementById('modal-gym-weight').value) || 0;

    if (!trackerData.gymLogs) trackerData.gymLogs = {};
    if (!trackerData.gymLogs[currentExerciseName]) trackerData.gymLogs[currentExerciseName] = [];

    trackerData.gymLogs[currentExerciseName].push({ date, sets, reps, weight });
    saveData();

    document.getElementById('modal-gym-reps').value = '';
    document.getElementById('modal-gym-weight').value = '';
    updateModalGymChart();
}

function initModalGymChart() {
    const ctx = document.getElementById('modalGymChart').getContext('2d');
    modalGymChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Beban (kg)',
                    data: [],
                    borderColor: '#ff4d6d',
                    backgroundColor: 'rgba(255, 77, 109, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Total Volume (kg)',
                    data: [],
                    borderColor: '#4318ff',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { type: 'linear', position: 'left', beginAtZero: true },
                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, beginAtZero: true }
            }
        }
    });
}

function updateModalGymChart() {
    const logs = trackerData.gymLogs ? (trackerData.gymLogs[currentExerciseName] || []) : [];
    
    if (modalGymChart) {
        modalGymChart.data.labels = logs.map(l => l.date);
        modalGymChart.data.datasets[0].data = logs.map(l => l.weight);
        modalGymChart.data.datasets[1].data = logs.map(l => l.sets * l.reps * (l.weight || 1));
        modalGymChart.update();
    }
}

/* Treadmill Modal & Chart */
function openTreadmillModal() {
    treadmillModal.classList.add('active');
    updateModalTreadmillChart();
}

function saveTreadmillModalLog() {
    const date = document.getElementById('modal-tm-date').value || `Sesi ${(trackerData.treadmillLogs || []).length + 1}`;
    const time = parseFloat(document.getElementById('modal-tm-time').value) || 0;
    const incline = parseFloat(document.getElementById('modal-tm-incline').value) || 0;
    const speed = parseFloat(document.getElementById('modal-tm-speed').value) || 0;

    if (!trackerData.treadmillLogs) trackerData.treadmillLogs = [];

    trackerData.treadmillLogs.push({ date, time, incline, speed });
    saveData();

    document.getElementById('modal-tm-time').value = '';
    document.getElementById('modal-tm-incline').value = '';
    document.getElementById('modal-tm-speed').value = '';
    updateModalTreadmillChart();
}

function initModalTreadmillChart() {
    const ctx = document.getElementById('modalTreadmillChart').getContext('2d');
    modalTreadmillChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Durasi (Menit)',
                    data: [],
                    borderColor: '#4318ff',
                    borderWidth: 3,
                    tension: 0.3
                },
                {
                    label: 'Incline',
                    data: [],
                    borderColor: '#01b574',
                    borderWidth: 3,
                    tension: 0.3
                },
                {
                    label: 'Speed (km/h)',
                    data: [],
                    borderColor: '#ff9f43',
                    borderWidth: 3,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function updateModalTreadmillChart() {
    const logs = trackerData.treadmillLogs || [];

    if (modalTreadmillChart) {
        modalTreadmillChart.data.labels = logs.map(l => l.date);
        modalTreadmillChart.data.datasets[0].data = logs.map(l => l.time);
        modalTreadmillChart.data.datasets[1].data = logs.map(l => l.incline);
        modalTreadmillChart.data.datasets[2].data = logs.map(l => l.speed);
        modalTreadmillChart.update();
    }
}

document.addEventListener('DOMContentLoaded', init);
