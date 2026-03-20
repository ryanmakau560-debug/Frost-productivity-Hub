// ==========================
// Frost - Unified JS for all pages (Index, Tasks, Focus, Stats)
// ==========================

// --------------------------
// INDEX.HTML VARIABLES
// --------------------------
const nameInput = document.getElementById('nameInput');
const dashboardDate = document.getElementById('date');
const tasksCompletedEl = document.getElementById('tasksCompleted');
const sessionsEl = document.getElementById('sessions');

// --------------------------
// TASKS.HTML VARIABLES
// --------------------------
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// --------------------------
// FOCUS.HTML VARIABLES
// --------------------------
let focusSessions = JSON.parse(localStorage.getItem('focusSessions')) || [];
// focusSessions will now store array of session minutes: [25, 30, 15,...]
let timer = 25 * 60; // seconds
let interval = null;
const focusTimerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const focusMinutesInput = document.getElementById('focusMinutes');

// --------------------------
// STATS.HTML VARIABLES
// --------------------------
const totalTasksEl = document.getElementById('totalTasks');
const focusTimeEl = document.getElementById('focusTime');
const productivityEl = document.getElementById('productivitySummary');

// ==========================
// INDEX.HTML FUNCTIONS
// ==========================
function saveName() {
    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (name) {
        localStorage.setItem('username', name);
        alert(`Welcome back, ${name}!`);
        nameInput.value = name; // keep name visible
    }
}

function initIndex() {
    if (!nameInput) return;
    const storedName = localStorage.getItem('username');
    if (storedName) nameInput.value = storedName;

    if (dashboardDate) {
        const today = new Date();
        dashboardDate.textContent = today.toLocaleDateString();
    }

    if (tasksCompletedEl) {
        const completed = tasks.filter(t => t.completed).length;
        tasksCompletedEl.textContent = completed;
    }

    if (sessionsEl) {
        const totalFocus = focusSessions.reduce((a,b)=>a+b,0);
        sessionsEl.textContent = totalFocus;
    }
}

// ==========================
// TASKS.HTML FUNCTIONS
// ==========================
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    taskList.innerHTML = '';
    const now = new Date();

    tasks.forEach((task,index)=>{
        const li = document.createElement('li');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;

        const text = document.createElement('span');
        text.textContent = `${task.text} (Due: ${task.deadline})`;

        const deadlineDate = new Date(task.deadline);
        const diffHrs = (deadlineDate - now)/(1000*60*60);

        li.classList.remove('overdue','near');
        if(diffHrs <0 && !task.completed) li.classList.add('overdue');
        else if(diffHrs <=24 && !task.completed) li.classList.add('near');

        if(task.completed) text.style.textDecoration = 'line-through';

        checkbox.addEventListener('change',()=>{
            tasks[index].completed = checkbox.checked;
            text.style.textDecoration = checkbox.checked ? 'line-through':'none';
            saveTasks();
        });

        const delButton = document.createElement('button');
        delButton.textContent = 'Delete';
        delButton.classList.add('delete-task');
        delButton.addEventListener('click',()=>{
            tasks.splice(index,1);
            saveTasks();
        });

        li.appendChild(checkbox);
        li.appendChild(text);
        li.appendChild(delButton);
        taskList.appendChild(li);
    });

    const completedCountEl = document.getElementById('completedCount');
    if(completedCountEl){
        completedCountEl.innerText = tasks.filter(t=>t.completed).length;
    }
}

function addTask(){
    const input = document.getElementById('taskInput');
    const deadlineInput = document.getElementById('deadlineInput');
    if(!input||!deadlineInput) return;

    const text = input.value.trim();
    const deadline = deadlineInput.value;

    if(text && deadline){
        tasks.push({text, completed:false, deadline:deadline});
        input.value = '';
        deadlineInput.value = '';
        saveTasks();
    }else{
        alert('Please enter a task and a deadline.');
    }
}

// ==========================
// FOCUS.HTML FUNCTIONS
// ==========================
function updateTimerDisplay(){
    if(!focusTimerDisplay) return;
    const mins = Math.floor(timer/60);
    const secs = timer%60;
    focusTimerDisplay.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}

function startTimer(){
    if(!focusTimerDisplay) return;
    if(interval) return;

    let sessionMinutes = 25; // default
    if(focusMinutesInput && focusMinutesInput.value){
        const customMins = parseInt(focusMinutesInput.value);
        if(!isNaN(customMins)&&customMins>0) sessionMinutes = customMins;
    }
    timer = sessionMinutes*60;

    interval = setInterval(()=>{
        if(timer<=0){
            clearInterval(interval);
            interval=null;
            incrementFocusSession(sessionMinutes);
            timer=25*60;
            updateTimerDisplay();
            if(pauseBtn) pauseBtn.textContent='Pause';
        }else{
            timer--;
            updateTimerDisplay();
        }
    },1000);
}

function pauseTimer(){
    if(!pauseBtn) return;
    if(!interval){
        startTimer();
        pauseBtn.textContent='Pause';
    }else{
        clearInterval(interval);
        interval=null;
        pauseBtn.textContent='Unpause';
    }
}

function incrementFocusSession(minutes){
    focusSessions.push(minutes);
    localStorage.setItem('focusSessions', JSON.stringify(focusSessions));
    updateFocusDisplay();
}

function updateFocusDisplay(){
    if(sessionsEl){
        const total = focusSessions.reduce((a,b)=>a+b,0);
        sessionsEl.textContent = total;
    }
}

// ==========================
// STATS.HTML FUNCTIONS
// ==========================
function updateStats(){
    if(!totalTasksEl || !focusTimeEl || !productivityEl) return;

    const totalCompleted = tasks.filter(t=>t.completed).length;
    const pending = tasks.length-totalCompleted;

    totalTasksEl.textContent = totalCompleted;

    const totalFocusMinutes = focusSessions.reduce((a,b)=>a+b,0);
    focusTimeEl.textContent = totalFocusMinutes;

    let productivityPercent = 0;
    if(tasks.length>0) productivityPercent = Math.round((totalCompleted/tasks.length)*100);
    productivityEl.textContent = `${productivityPercent}%`;
}

// ==========================
// INITIALIZATION
// ==========================
window.addEventListener('DOMContentLoaded',()=>{
    // Index
    initIndex();

    // Tasks
    renderTasks();

    // Focus
    updateFocusDisplay();
    updateTimerDisplay();
    if(startBtn) startBtn.addEventListener('click',startTimer);
    if(pauseBtn) pauseBtn.addEventListener('click',pauseTimer);

    // Stats
    updateStats();
});