let focusTime = 5;
let breakTime = 5;
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

function createParticles() {
  const emojis = ['✨', '🌟', '⭐', '💚', '🌱', '🎉', '🌸'];
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      particle.style.left = (Math.random() * window.innerWidth) + 'px';
      particle.style.top = '-50px';
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 3000);
    }, i * 60);
  }
}

function updatePlantDisplay(shouldAnimate = false) {
  const stage = getCurrentPlantStage();
  
  const plantEmoji = document.getElementById("plant-emoji");
  
  if (shouldAnimate) {
    plantEmoji.classList.add("upgrade-animation");
    setTimeout(() => plantEmoji.classList.remove("upgrade-animation"), 600);
  }
  
  plantEmoji.textContent = stage.emoji;
  document.getElementById("plant-stage").textContent = stage.name;
  document.getElementById("plant-progress").textContent =
    `${currentPlantSessions}/25 sessions`;

  const progress = (currentPlantSessions / 25) * 100;
  document.getElementById("progress-fill").style.width = `${progress}%`;

  if (currentPlantSessions >= 25) {
    completePlant();
  }
}

function completePlant() {
  const plantEmoji = document.getElementById("plant-emoji");
  
  // Add flying animation
  plantEmoji.classList.add("flying");
  createParticles();
  
  setTimeout(() => {
    completedPlants.push("🌳");
    localStorage.setItem("completedPlants", JSON.stringify(completedPlants));

    currentPlantSessions = 0;
    localStorage.setItem("currentPlantSessions", currentPlantSessions);

    plantEmoji.classList.remove("flying");
    updatePlantDisplay(true);
    updateGardenGrid(true);

    if (Notification.permission === "granted") {
      new Notification("Focus Garden", {
        body: "🎉 Your tree is complete! It's been added to your garden.",
        icon: "https://cdn-icons-png.flaticon.com/512/427/427735.png"
      });
    }
  }, 1000);
}

/* ------------------------ GARDEN GRID ------------------------ */

function updateGardenGrid(animateNew = false) {
  const grid = document.getElementById("garden-grid");
  grid.innerHTML = "";

  const plantsPerPage = 9;
  const totalPages = Math.ceil(completedPlants.length / plantsPerPage);

  const reversedPlants = [...completedPlants].reverse();
  const startIdx = currentPage * plantsPerPage;
  const plantsOnPage = reversedPlants.slice(startIdx, startIdx + plantsPerPage);

  plantsOnPage.forEach((plant, index) => {
    const slot = document.createElement("div");
    slot.className = "garden-slot filled";
    
    if (animateNew && index === 0 && currentPage === 0) {
      slot.classList.add("new");
    }
    
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

      if (isFocus) {
        handleFocusComplete();
      } else {
        handleBreakComplete();
      }
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

  const oldStage = getCurrentPlantStage().name;
  
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

  // Pulse animation for stats
  document.getElementById("streak").classList.add("pulse");
  document.getElementById("sessions").classList.add("pulse");
  setTimeout(() => {
    document.getElementById("streak").classList.remove("pulse");
    document.getElementById("sessions").classList.remove("pulse");
  }, 500);

  document.getElementById("streak").textContent = streak;
  document.getElementById("sessions").textContent = sessionsCompleted;
  
  const newStage = getCurrentPlantStage().name;
  const didUpgrade = oldStage !== newStage;
  
  updatePlantDisplay(didUpgrade);
  
  if (didUpgrade) {
    createParticles();
  }

  isFocus = false;
  modeLabel.innerHTML = '<i class="fas fa-cloud-sun"></i> Break Mode';
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
  modeLabel.innerHTML = '<i class="fas fa-book-open"></i> Focus Mode';
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
      <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
      <span class="task-text">${task.text}</span>
      <button class="task-edit"><i class="fas fa-pencil-alt"></i></button>
      <button class="task-delete">Delete</button>
    `;

    taskList.appendChild(li);
  });
}

/* ---------------------- TASK CLICK ACTIONS ---------------------- */

const taskListEl = document.getElementById("task-list");

taskListEl.addEventListener("click", (e) => {
  const li = e.target.closest(".task-item");
  if (!li) return;

  const index = parseInt(li.dataset.index);

  if (e.target.closest(".task-checkbox")) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
    return;
  }

  if (e.target.closest(".task-delete")) {
    tasks.splice(index, 1);
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

/* ----------------------- INIT ----------------------- */

updateDisplay();
updatePlantDisplay();
updateGardenGrid();
renderTasks();

document.getElementById("streak").textContent = streak;
document.getElementById("sessions").textContent = sessionsCompleted;

/* ======================= BRAIN FACTS TAB ======================= */

const brainFacts = [
  {
    icon: "🧠",
    title: "The Pomodoro Technique",
    content: "Working in 25-minute focused intervals followed by short breaks leverages your brain's natural attention span. This technique helps maintain high concentration while preventing mental fatigue.",
    source: "Time Management Research"
  },
  {
    icon: "⏰",
    title: "Ultradian Rhythms",
    content: "Your brain operates in 90-120 minute cycles of high and low alertness called ultradian rhythms. Taking breaks every 90 minutes aligns with your natural productivity peaks.",
    source: "Sleep & Performance Studies"
  },
  {
    icon: "💡",
    title: "The Spacing Effect",
    content: "Spreading out study sessions over time (spaced repetition) leads to better long-term retention than cramming. Your brain consolidates information more effectively with rest periods in between.",
    source: "Cognitive Psychology"
  },
  {
    icon: "🎯",
    title: "Single-Tasking Superiority",
    content: "Multitasking can reduce productivity by up to 40%. Your brain performs best when focusing on one task at a time, as task-switching depletes cognitive resources.",
    source: "Neuroscience Research"
  },
  {
    icon: "🌙",
    title: "Sleep & Memory Consolidation",
    content: "Sleep plays a crucial role in memory formation. During deep sleep, your brain consolidates what you learned during the day, transferring information from short-term to long-term memory.",
    source: "Sleep Science"
  },
  {
    icon: "🚶",
    title: "Movement Boosts Cognition",
    content: "Short walks or light exercise during breaks increase blood flow to the brain, improving focus and creativity. Even 5 minutes of movement can enhance cognitive performance.",
    source: "Exercise Neuroscience"
  },
  {
    icon: "🎵",
    title: "Music & Focus",
    content: "Instrumental music, especially classical or lo-fi, can enhance concentration for many people. However, music with lyrics may distract during complex cognitive tasks.",
    source: "Music Psychology"
  },
  {
    icon: "💧",
    title: "Hydration & Brain Function",
    content: "Even mild dehydration (1-2% loss) can impair attention, memory, and mood. Your brain is 75% water, so staying hydrated is essential for optimal cognitive performance.",
    source: "Nutritional Neuroscience"
  },
  {
    icon: "🧘",
    title: "Mindfulness & Attention",
    content: "Just 10 minutes of daily mindfulness meditation can improve sustained attention and reduce mind-wandering. Regular practice actually changes brain structure in areas related to focus.",
    source: "Meditation Research"
  },
  {
    icon: "📝",
    title: "Handwriting vs. Typing",
    content: "Taking notes by hand activates more brain regions than typing, leading to better conceptual understanding and retention. The slower pace forces deeper processing of information.",
    source: "Educational Psychology"
  }
];

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function renderFacts() {
  const factsFeed = document.getElementById("facts-feed");
  factsFeed.innerHTML = "";
  
  const shuffledFacts = shuffleArray(brainFacts);
  
  shuffledFacts.forEach((fact, index) => {
    const card = document.createElement("div");
    card.className = "fact-card";
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
      <span class="fact-icon">${fact.icon}</span>
      <h3 class="fact-title">${fact.title}</h3>
      <p class="fact-content">${fact.content}</p>
      <p class="fact-source">— ${fact.source}</p>
    `;
    
    factsFeed.appendChild(card);
  });
}

// Tab switching
document.getElementById("timer-tab-btn").addEventListener("click", () => {
  document.getElementById("timer-view").classList.add("active");
  document.getElementById("facts-view").classList.remove("active");
  document.getElementById("timer-tab-btn").classList.add("active");
  document.getElementById("facts-tab-btn").classList.remove("active");
});

document.getElementById("facts-tab-btn").addEventListener("click", () => {
  document.getElementById("facts-view").classList.add("active");
  document.getElementById("timer-view").classList.remove("active");
  document.getElementById("facts-tab-btn").classList.add("active");
  document.getElementById("timer-tab-btn").classList.remove("active");
  renderFacts(); // Refresh facts when switching to tab
});

document.getElementById("refresh-facts").addEventListener("click", () => {
  renderFacts();
  
  // Add spin animation to refresh button
  const btn = document.getElementById("refresh-facts");
  const icon = btn.querySelector("i");
  icon.style.animation = "none";
  setTimeout(() => {
    icon.style.animation = "spin 0.5s ease-in-out";
  }, 10);
});

// Add spin animation for refresh icon
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Initialize facts on load
renderFacts();