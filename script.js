let focusTime = 10; 
let breakTime = 10;
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

const timeDisplay = document.getElementById("time");
const modeLabel = document.getElementById("mode-label");
document.body.classList.add("focus-mode");

if ("Notification" in window) {
  Notification.requestPermission();
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

  if (currentPlantSessions >= 25) completePlant();
}

function completePlant() {
  completedPlants.push("🌳");
  localStorage.setItem("completedPlants", JSON.stringify(completedPlants));

  currentPlantSessions = 0;
  localStorage.setItem("currentPlantSessions", currentPlantSessions);

  updatePlantDisplay();
  updateGardenGrid();

  if (Notification.permission === "granted") {
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
  const totalPages = Math.ceil(completedPlants.length / plantsPerPage);

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
  const totalPages = Math.ceil(completedPlants.length / 9);
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

      if (isFocus) handleFocusComplete();
      else handleBreakComplete();
    }
  }, 500);
}

function handleFocusComplete() {
  if (Notification.permission === "granted") {
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

  document.getElementById("streak").textContent = streak;
  document.getElementById("sessions").textContent = sessionsCompleted;
  updatePlantDisplay();

  isFocus = false;
  modeLabel.innerHTML = 'Break Mode <i class="fas fa-cloud-sun"></i>';
  document.body.classList.replace("focus-mode", "break-mode");
  updateColors();
  time = breakTime;
  startTimer();
}

function handleBreakComplete() {
  if (Notification.permission === "granted") {
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
  if (!confirm("Reset streak and sessions?")) return;

  sessionsCompleted = 0;
  streak = 0;
  currentPlantSessions = 0;
  completedPlants = [];
  lastSessionDate = null;
  currentPage = 0;

  localStorage.setItem("sessionsCompleted", "0");
  localStorage.setItem("streak", "0");
  localStorage.setItem("currentPlantSessions", "0");
  localStorage.setItem("completedPlants", JSON.stringify([]));
  localStorage.removeItem("lastSessionDate");

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
      <input type="checkbox" class="task-checkbox" data-index="${index}" ${
        task.completed ? "checked" : ""
      }>
      <span class="task-text" data-index="${index}">${task.text}</span>
      <button class="task-edit"><i class="fas fa-pencil-alt"></i></button>
      <button class="task-delete">Delete</button>
    `;

    taskList.appendChild(li);
  });
}

/* ---------------------- TASK CLICK ACTIONS ---------------------- */

document.getElementById("task-list").addEventListener("click", (e) => {
  const index = e.target.dataset.index;

  if (e.target.classList.contains("task-checkbox")) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
    return;
  }

  if (e.target.classList.contains("task-delete")) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    return;
  }

  if (e.target.closest(".task-edit")) {
    const span = document.querySelector(`.task-text[data-index='${index}']`);
    span.contentEditable = true;
    span.classList.add("editing");
    span.focus();

    const finish = () => {
      span.contentEditable = false;
      span.classList.remove("editing");
      tasks[index].text = span.textContent.trim();
      saveTasks();
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

const taskListEl = document.getElementById("task-list");

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

  dragStartIndex = dragEndIndex = null;
});

/* ----------------------- INIT ----------------------- */

updateDisplay();
updatePlantDisplay();
updateGardenGrid();
renderTasks();

document.getElementById("streak").textContent = streak;
document.getElementById("sessions").textContent = sessionsCompleted;