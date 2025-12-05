let focusTime = 25 * 60;
let breakTime = 5 * 60;
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

const timeDisplay = document.getElementById("time");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const modeLabel = document.getElementById("mode-label");
const resetStatsBtn = document.getElementById("reset-stats-btn");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

document.body.classList.add("focus-mode");

if ("Notification" in window) {
  Notification.requestPermission();
}

// Plant stages
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
  document.getElementById("plant-progress").textContent = `${currentPlantSessions}/25 sessions`;
  
  const progress = (currentPlantSessions / 25) * 100;
  document.getElementById("progress-fill").style.width = `${progress}%`;

  // Check if plant is complete
  if (currentPlantSessions >= 25) {
    completePlant();
  }
}

function completePlant() {
  // Add tree to garden
  completedPlants.push("🌳");
  localStorage.setItem("completedPlants", JSON.stringify(completedPlants));
  
  // Reset current plant
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

function updateGardenGrid() {
  const grid = document.getElementById("garden-grid");
  grid.innerHTML = "";
  
  const plantsPerPage = 9;
  const totalPages = Math.ceil(completedPlants.length / plantsPerPage);
  
  // Get plants for current page (newest first, so reverse the array)
  const reversedPlants = [...completedPlants].reverse();
  const startIdx = currentPage * plantsPerPage;
  const endIdx = startIdx + plantsPerPage;
  const plantsOnPage = reversedPlants.slice(startIdx, endIdx);
  
  // Show plants on this page
  plantsOnPage.forEach(plant => {
    const slot = document.createElement("div");
    slot.className = "garden-slot filled";
    slot.textContent = plant;
    grid.appendChild(slot);
  });
  
  // Fill empty slots up to 9
  const emptySlots = plantsPerPage - plantsOnPage.length;
  for (let i = 0; i < emptySlots; i++) {
    const slot = document.createElement("div");
    slot.className = "garden-slot";
    grid.appendChild(slot);
  }
  
  // Update pagination
  if (completedPlants.length > 0) {
    pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
  } else {
    pageInfo.textContent = "No plants yet";
  }
  
  // Enable/disable buttons
  prevPageBtn.disabled = currentPage === 0;
  nextPageBtn.disabled = currentPage >= totalPages - 1 || completedPlants.length === 0;
}

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    updateGardenGrid();
  }
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(completedPlants.length / 9);
  if (currentPage < totalPages - 1) {
    currentPage++;
    updateGardenGrid();
  }
});

function updateColors() {
  const isBreak = document.body.classList.contains("break-mode");
  const newColor = isBreak ? "var(--break-text)" : "var(--focus-text)";
  
  document.querySelector("h1").style.color = newColor;
  document.querySelector(".subtitle").style.color = newColor;
  timeDisplay.style.color = newColor;
  modeLabel.style.color = isBreak ? "var(--break-mode-label)" : "var(--accent)";
}

function updateDisplay() {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  timeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startTimer() {
  if (!running) {
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

        if (isFocus) {
          if (Notification.permission === "granted") {
            new Notification("Focus Garden", {
              body: "Focus session complete! Time for a break ☁️",
              icon: "https://cdn-icons-png.flaticon.com/512/427/427735.png"
            });
          }
          
          // Track completed sessions
          sessionsCompleted++;
          currentPlantSessions++;
          localStorage.setItem("sessionsCompleted", sessionsCompleted);
          localStorage.setItem("currentPlantSessions", currentPlantSessions);

          // Streak logic
          const today = new Date().toDateString();
          if (lastSessionDate !== today) {
            if (lastSessionDate) {
              const yesterday = new Date(Date.now() - 86400000).toDateString();
              streak = (lastSessionDate === yesterday) ? streak + 1 : 1;
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
        } else {
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
      }
    }, 500);
  }
}

startBtn.addEventListener("click", startTimer);

pauseBtn.addEventListener("click", () => {
  clearInterval(timer);
  running = false;
});

resetBtn.addEventListener("click", () => {
  clearInterval(timer);
  running = false;
  isFocus = true;
  document.body.classList.remove("break-mode");
  document.body.classList.add("focus-mode");
  updateColors();
  modeLabel.innerHTML = 'Focus Mode <i class="fas fa-book-open"></i>';
  time = focusTime;
  updateDisplay();
});

resetStatsBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to reset your streak and sessions? This cannot be undone.")) {
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
  }
});

// TASKS FUNCTIONALITY
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = "";
  
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    
    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} data-index="${index}">
      <span class="task-text">${task.text}</span>
      <button class="task-delete" data-index="${index}">Delete</button>
    `;
    
    taskList.appendChild(li);
  });
}

document.getElementById("add-task-btn").addEventListener("click", () => {
  const input = document.getElementById("task-input");
  const text = input.value.trim();
  
  if (text) {
    tasks.push({ text, completed: false });
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

document.getElementById("task-list").addEventListener("click", (e) => {
  if (e.target.classList.contains("task-checkbox")) {
    const index = parseInt(e.target.dataset.index);
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
  }
  
  if (e.target.classList.contains("task-delete")) {
    const index = parseInt(e.target.dataset.index);
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
});

// Initialize
updateDisplay();
updatePlantDisplay();
updateGardenGrid();
renderTasks();
document.getElementById("streak").textContent = streak;
document.getElementById("sessions").textContent = sessionsCompleted;