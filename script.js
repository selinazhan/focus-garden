let focusTime = 10; // testing; later 25 * 60
let breakTime = 10; // testing; later 5 * 60
let time = focusTime;
let timer;
let running = false;
let isFocus = true;

let sessionsCompleted = parseInt(localStorage.getItem("sessionsCompleted")) || 0;
let lastSessionDate = localStorage.getItem("lastSessionDate") || null;
let streak = parseInt(localStorage.getItem("streak")) || 0;

let currentPlantSessions = parseInt(localStorage.getItem("currentPlantSessions")) || 0;
let completedPlants = JSON.parse(localStorage.getItem("completedPlants")) || [];

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentPage = 0;

let dragStartIndex = null;
let dragEndIndex = null;

/* SETTINGS + DAILY DATA */

let settings = {
  sound: localStorage.getItem("settings_sound") !== "false",
  darkMode: localStorage.getItem("settings_darkMode") === "true",
  notifications: localStorage.getItem("settings_notifications") !== "false"
};

let dailyData = JSON.parse(localStorage.getItem("dailyData")) || {};
let lastSummaryShownDate = localStorage.getItem("lastSummaryShownDate") || null;

/* DOM */

const timeDisplay = document.getElementById("time");
const modeLabel = document.getElementById("mode-label");
const overlayEl = document.getElementById("overlay");
const settingsModal = document.getElementById("settings-modal");
const summaryModal = document.getElementById("summary-modal");
const taskListEl = document.getElementById("task-list");

document.body.classList.add("focus-mode");
if (settings.darkMode) {
  document.body.classList.add("dark-mode");
}

/* SOUNDS */

const sounds = {
  start: new Audio("sounds/start.mp3"),
  focusEnd: new Audio("sounds/focus-end.mp3"),
  breakEnd: new Audio("sounds/break-end.mp3"),
  plantComplete: new Audio("sounds/plant-complete.mp3"),
  taskAdd: new Audio("sounds/task-add.mp3"),
  taskDelete: new Audio("sounds/task-delete.mp3"),
  taskComplete: new Audio("sounds/task-complete.mp3")
};

function playSound(name) {
  if (!settings.sound) return;
  const audio = sounds[name];
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

/* HELPERS FOR DATES */

function getTodayKey() {
  return new Date().toDateString();
}

function getYesterdayKey() {
  return new Date(Date.now() - 86400000).toDateString();
}

function ensureDailyEntry(dateKey) {
  if (!dailyData[dateKey]) {
    dailyData[dateKey] = { sessions: 0, tasksCompleted: 0 };
  }
}

/* -------------------------- PLANT STAGES ---------------------------- */

const plantStages = [
  { name: "Seed", emoji: "🌱", min: 0, max: 5 },
  { name: "Sprout", emoji: "🌿", min: 6, max: 10 },
  { name: "Flowering", emoji: "🌸", min: 11, max: 15 },
  { name: "Tree", emoji: "🌳", min: 16, max: 25 }
];

function getCurrentPlantStage() {
  for (let stage of plantStages) {
    if (currentPlantSessions >= stage.min && currentPlantSessions <= stage.max) {
      return stage;
    }
  }
  return plantStages[0];
}

function updatePlantDisplay() {
  const stage = getCurrentPlantStage();
  document.getElementById("plant-emoji").textContent = stage.emoji;
  document.getElementById("plant-stage").textContent = stage.name;
  document.getElementById("plant-progress").textContent =
    `${currentPlantSessions}/25 sessions`;

  const progress = (currentPlantSessions / 25) * 100;
  document.getElementById("progress-fill").style.width = `${progress}%`;

  if (currentPlantSessions >= 25) {
    completePlant();
  }
}

function triggerPlantAnimation(isComplete) {
  const plantCard = document.querySelector(".current-plant");
  const plantEmoji = document.querySelector(".plant-visual");
  const plantStageEl = document.querySelector(".plant-stage");

  plantEmoji.classList.add("plant-pop");
  plantStageEl.classList.add("stage-change");
  plantCard.classList.add("plant-card-pop");
  if (isComplete) {
    plantCard.classList.add("plant-confetti");
  }

  setTimeout(() => {
    plantEmoji.classList.remove("plant-pop");
    plantStageEl.classList.remove("stage-change");
    plantCard.classList.remove("plant-card-pop");
    plantCard.classList.remove("plant-confetti");
  }, 900);
}

function completePlant() {
  completedPlants.push("🌳");
  localStorage.setItem("completedPlants", JSON.stringify(completedPlants));

  currentPlantSessions = 0;
  localStorage.setItem("currentPlantSessions", currentPlantSessions);

  updatePlantDisplay();

  // jump to first page and animate newest tree
  currentPage = 0;
  updateGardenGrid();
  const firstSlot = document.querySelector(".garden-slot.filled");
  if (firstSlot) {
    firstSlot.classList.add("new-tree");
    setTimeout(() => firstSlot.classList.remove("new-tree"), 800);
  }

  triggerPlantAnimation(true);
  playSound("plantComplete");

  if (settings.notifications &&
      "Notification" in window &&
      Notification.permission === "granted") {
    new Notification("Focus Garden", {
      body: "🎉 Your tree is complete! It's been added to your garden.",
      icon: "https://cdn-icons-png.flaticon.com/512/427/427735.png"
    });
  }
}

/* ------------------------ GARDEN GRID ------------------------ */

function updateGardenGrid() {
  const grid = document.getElementById("garden-grid");
  grid.innerHTML = "";

  const plantsPerPage = 9;
  const totalPages = Math.ceil(completedPlants.length / plantsPerPage) || 1;

  const reversedPlants = [...completedPlants].reverse();
  const startIdx = currentPage * plantsPerPage;
  const plantsOnPage = reversedPlants.slice(startIdx, startIdx + plantsPerPage);

  plantsOnPage.forEach(plant => {
    const slot = document.createElement("div");
    slot.className = "garden-slot filled";
    slot.textContent = plant;
    grid.appendChild(slot);
  });

  for (let i = plantsOnPage.length; i < plantsPerPage; i++) {
    const empty = document.createElement("div");
    empty.className = "garden-slot";
    grid.appendChild(empty);
  }

  const pageInfo = document.getElementById("page-info");
  if (completedPlants.length === 0) {
    pageInfo.textContent = "No plants yet";
  } else {
    pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
  }

  document.getElementById("prev-page").disabled = currentPage === 0;
  document.getElementById("next-page").disabled =
    currentPage >= totalPages - 1 || completedPlants.length === 0;
}

document.getElementById("prev-page").addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    updateGardenGrid();
  }
});

document.getElementById("next-page").addEventListener("click", () => {
  const totalPages = Math.ceil(completedPlants.length / 9) || 1;
  if (currentPage < totalPages - 1) {
    currentPage++;
    updateGardenGrid();
  }
});

/* ---------------------------- TIMER ---------------------------- */

function updateDisplay() {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  timeDisplay.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateColors() {
  const isBreak = document.body.classList.contains("break-mode");
  const newColor = isBreak ? "var(--break-text)" : "var(--focus-text)";

  document.querySelector("h1").style.color = newColor;
  document.querySelector(".subtitle").style.color = newColor;
  timeDisplay.style.color = newColor;
  modeLabel.style.color = isBreak ? "var(--break-mode-label)" : "var(--accent)";
}

function startTimer() {
  if (running) return;

  running = true;
  const endTime = Date.now() + time * 1000;

  playSound("start");

  timer = setInterval(() => {
    const remaining = Math.round((endTime - Date.now()) / 1000);

    if (remaining > 0) {
      time = remaining;
      updateDisplay();
    } else {
      clearInterval(timer);
      running = false;
      time = 0;
      updateDisplay();

      if (isFocus) {
        handleFocusComplete();
      } else {
        handleBreakComplete();
      }
    }
  }, 500);
}

function handleFocusComplete() {
  playSound("focusEnd");

  if (settings.notifications &&
      "Notification" in window &&
      Notification.permission === "granted") {
    new Notification("Focus Garden", {
      body: "Focus session complete! Time for a break ☁️",
      icon: "https://cdn-icons-png.flaticon.com/512/427/427735.png"
    });
  }

  sessionsCompleted++;
  currentPlantSessions++;
  localStorage.setItem("sessionsCompleted", sessionsCompleted);
  localStorage.setItem("currentPlantSessions", currentPlantSessions);

  const today = new Date().toDateString();
  if (lastSessionDate !== today) {
    if (lastSessionDate) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = lastSessionDate === yesterday ? streak + 1 : 1;
    } else {
      streak = 1;
    }
    lastSessionDate = today;

    localStorage.setItem("streak", streak);
    localStorage.setItem("lastSessionDate", lastSessionDate);
  }

  // update dailyData
  const todayKey = getTodayKey();
  ensureDailyEntry(todayKey);
  dailyData[todayKey].sessions += 1;
  localStorage.setItem("dailyData", JSON.stringify(dailyData));

  document.getElementById("streak").textContent = streak;
  document.getElementById("sessions").textContent = sessionsCompleted;

  updatePlantDisplay();
  triggerPlantAnimation(false);

  isFocus = false;
  modeLabel.innerHTML = 'Break Mode <i class="fas fa-cloud-sun"></i>';
  document.body.classList.replace("focus-mode", "break-mode");
  updateColors();
  time = breakTime;
  startTimer();
}

function handleBreakComplete() {
  playSound("breakEnd");

  if (settings.notifications &&
      "Notification" in window &&
      Notification.permission === "granted") {
    new Notification("Focus Garden", {
      body: "Break over! Back to focus 📖",
      icon: "https://cdn-icons-png.flaticon.com/512/427/427735.png"
    });
  }

  isFocus = true;
  modeLabel.innerHTML = 'Focus Mode <i class="fas fa-book-open"></i>';
  document.body.classList.replace("break-mode", "focus-mode");
  updateColors();
  time = focusTime;
  updateDisplay();
}

document.getElementById("start").addEventListener("click", startTimer);
document.getElementById("pause").addEventListener("click", () => {
  clearInterval(timer);
  running = false;
});
document.getElementById("reset").addEventListener("click", () => {
  clearInterval(timer);
  running = false;
  isFocus = true;
  document.body.classList.replace("break-mode", "focus-mode");
  updateColors();
  modeLabel.innerHTML = 'Focus Mode <i class="fas fa-book-open"></i>';
  time = focusTime;
  updateDisplay();
});

/* ------------------------- RESET STATS ------------------------- */

document.getElementById("reset-stats-btn").addEventListener("click", () => {
  if (!confirm("Are you sure you want to reset your streak and sessions? This cannot be undone.")) {
    return;
  }

  sessionsCompleted = 0;
  streak = 0;
  currentPlantSessions = 0;
  completedPlants = [];
  lastSessionDate = null;
  currentPage = 0;
  dailyData = {};
  lastSummaryShownDate = null;

  localStorage.setItem("sessionsCompleted", "0");
  localStorage.setItem("streak", "0");
  localStorage.setItem("currentPlantSessions", "0");
  localStorage.setItem("completedPlants", JSON.stringify([]));
  localStorage.removeItem("lastSessionDate");
  localStorage.setItem("dailyData", JSON.stringify(dailyData));
  localStorage.removeItem("lastSummaryShownDate");

  document.getElementById("streak").textContent = "0";
  document.getElementById("sessions").textContent = "0";

  updatePlantDisplay();
  updateGardenGrid();
});

/* ----------------------- TASK LIST ---------------------------- */

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.dataset.index = index;
    li.setAttribute("draggable", "true");

    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
      <span class="task-text">${task.text}</span>
      <button class="task-edit"><i class="fas fa-pencil-alt"></i></button>
      <button class="task-delete">Delete</button>
    `;

    taskList.appendChild(li);
  });
}

/* increment daily tasks completed when a task moves from incomplete to complete */

function incrementTasksCompletedToday() {
  const todayKey = getTodayKey();
  ensureDailyEntry(todayKey);
  dailyData[todayKey].tasksCompleted += 1;
  localStorage.setItem("dailyData", JSON.stringify(dailyData));
}

/* ---------------------- TASK CLICK ACTIONS ---------------------- */

taskListEl.addEventListener("click", (e) => {
  const li = e.target.closest(".task-item");
  if (!li) return;

  const index = parseInt(li.dataset.index);

  if (e.target.closest(".task-checkbox")) {
    const wasCompleted = tasks[index].completed;
    tasks[index].completed = !tasks[index].completed;

    if (!wasCompleted && tasks[index].completed) {
      incrementTasksCompletedToday();
      playSound("taskComplete");
    }

    saveTasks();
    renderTasks();
    return;
  }

  if (e.target.closest(".task-delete")) {
    tasks.splice(index, 1);
    playSound("taskDelete");
    saveTasks();
    renderTasks();
    return;
  }

  if (e.target.closest(".task-edit")) {
    const span = li.querySelector(".task-text");
    span.contentEditable = true;
    span.classList.add("editing");
    span.focus();

    const finish = () => {
      span.contentEditable = false;
      span.classList.remove("editing");
      tasks[index].text = span.textContent.trim();
      saveTasks();
      renderTasks();
    };

    span.addEventListener("blur", finish, { once: true });
    span.addEventListener("keypress", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        span.blur();
      }
    });
  }
});

/* -------------------- DRAG AND DROP REORDER -------------------- */

taskListEl.addEventListener("dragstart", (e) => {
  const li = e.target.closest(".task-item");
  if (!li) return;
  dragStartIndex = parseInt(li.dataset.index);
  li.classList.add("dragging");
});

taskListEl.addEventListener("dragend", (e) => {
  const li = e.target.closest(".task-item");
  if (!li) return;
  li.classList.remove("dragging");
});

taskListEl.addEventListener("dragenter", (e) => {
  const li = e.target.closest(".task-item");
  if (!li) return;
  dragEndIndex = parseInt(li.dataset.index);
});

taskListEl.addEventListener("dragover", (e) => {
  e.preventDefault();
});

taskListEl.addEventListener("drop", () => {
  if (dragStartIndex === null || dragEndIndex === null) return;

  const item = tasks.splice(dragStartIndex, 1)[0];
  tasks.splice(dragEndIndex, 0, item);

  saveTasks();
  renderTasks();

  dragStartIndex = null;
  dragEndIndex = null;
});

/* ----------------------- ADD TASK INPUT ----------------------- */

document.getElementById("add-task-btn").addEventListener("click", () => {
  const input = document.getElementById("task-input");
  const text = input.value.trim();

  if (text) {
    tasks.push({ text, completed: false });
    playSound("taskAdd");
    saveTasks();
    renderTasks();
    input.value = "";
  }
});

document.getElementById("task-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("add-task-btn").click();
  }
});

/* ----------------------- SETTINGS MODAL ------------------------ */

function openModal(modalEl) {
  overlayEl.classList.remove("hidden");
  modalEl.classList.remove("hidden");
}

function closeModal(modalEl) {
  modalEl.classList.add("hidden");
  if (settingsModal.classList.contains("hidden") &&
      summaryModal.classList.contains("hidden")) {
    overlayEl.classList.add("hidden");
  }
}

document.getElementById("settings-btn").addEventListener("click", () => {
  openModal(settingsModal);
});

document.getElementById("close-settings").addEventListener("click", () => {
  closeModal(settingsModal);
});

document.getElementById("close-summary").addEventListener("click", () => {
  closeModal(summaryModal);
});

overlayEl.addEventListener("click", () => {
  closeModal(settingsModal);
  closeModal(summaryModal);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal(settingsModal);
    closeModal(summaryModal);
  }
});

/* SETTINGS TOGGLES */

const soundToggle = document.getElementById("sound-toggle");
const darkToggle = document.getElementById("dark-mode-toggle");
const notifToggle = document.getElementById("notifications-toggle");

soundToggle.checked = settings.sound;
darkToggle.checked = settings.darkMode;
notifToggle.checked = settings.notifications;

soundToggle.addEventListener("change", (e) => {
  settings.sound = e.target.checked;
  localStorage.setItem("settings_sound", settings.sound);
});

darkToggle.addEventListener("change", (e) => {
  settings.darkMode = e.target.checked;
  localStorage.setItem("settings_darkMode", settings.darkMode);
  document.body.classList.toggle("dark-mode", settings.darkMode);
});

notifToggle.addEventListener("change", (e) => {
  settings.notifications = e.target.checked;
  localStorage.setItem("settings_notifications", settings.notifications);
  if (settings.notifications &&
      "Notification" in window &&
      Notification.permission === "default") {
    Notification.requestPermission();
  }
});

// request permission on load if notifications enabled and still default
if (settings.notifications &&
    "Notification" in window &&
    Notification.permission === "default") {
  Notification.requestPermission();
}

/* -------------------- DAILY SUMMARY POPUP -------------------- */

function maybeShowDailySummary() {
  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();

  if (lastSummaryShownDate === todayKey) return;

  const stats = dailyData[yesterdayKey];
  if (!stats) return;

  const sessions = stats.sessions || 0;
  const tasksCompleted = stats.tasksCompleted || 0;

  const summaryText = document.getElementById("summary-text");
  summaryText.textContent =
    `Yesterday you completed ${sessions} focus session${sessions === 1 ? "" : "s"} ` +
    `and checked off ${tasksCompleted} task${tasksCompleted === 1 ? "" : "s"}.`;

  openModal(summaryModal);
  lastSummaryShownDate = todayKey;
  localStorage.setItem("lastSummaryShownDate", lastSummaryShownDate);
}

/* ----------------------- INIT ----------------------- */

updateDisplay();
updatePlantDisplay();
updateGardenGrid();
renderTasks();

document.getElementById("streak").textContent = streak;
document.getElementById("sessions").textContent = sessionsCompleted;

maybeShowDailySummary();