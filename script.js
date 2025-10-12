let focusTime = 5;
let breakTime = 5;
let time = focusTime;
let timer;
let running = false;
let isFocus = true;
let sessionsCompleted = parseInt(localStorage.getItem("sessionsCompleted")) || 0;
let lastSessionDate = localStorage.getItem("lastSessionDate") || null;
let streak = parseInt(localStorage.getItem("streak")) || 0;

const timeDisplay = document.getElementById("time");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const modeLabel = document.getElementById("mode-label");

document.body.classList.add("focus-mode");

if ("Notification" in window) {
  Notification.requestPermission();
}

function updateColors() {
  const isBreak = document.body.classList.contains("break-mode");
  const newColor = isBreak ? "var(--break-text)" : "var(--focus-text)";

  document.querySelector("h1").style.color = newColor;
  document.querySelector(".subtitle").style.color = newColor;
  timeDisplay.style.color = newColor;
  modeLabel.style.color = newColor;
}

function updateDisplay() {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  timeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

function startTimer() {
  if (!running) {
    running = true;

    // set the target end time based on current time
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

        // --- mode switch ---
        if (isFocus) {
          if (Notification.permission === "granted") {
            new Notification("Focus Garden", {
              body: "Focus session complete! Time for a 5-minute break ☁️",
              icon: "https://cdn-icons-png.flaticon.com/512/427/427735.png"
            });
          } else {
            alert("Focus session complete! Time for a 5-minute break ☁️");
          }
          // track completed sessions and streak
          sessionsCompleted++;
          localStorage.setItem("sessionsCompleted", sessionsCompleted);

          // streak logic: if user already studied today, don't double-count
          const today = new Date().toDateString();
          if (lastSessionDate !== today) {
            if (lastSessionDate) {
              // check if yesterday was last session
              const yesterday = new Date(Date.now() - 86400000).toDateString();
              streak = (lastSessionDate === yesterday) ? streak + 1 : 1;
            } else {
              streak = 1;
            }
            lastSessionDate = today;
            localStorage.setItem("streak", streak);
            localStorage.setItem("lastSessionDate", lastSessionDate);
          }
          // update text on screen
          document.getElementById("streak").textContent = streak;
          document.getElementById("sessions").textContent = sessionsCompleted;
          isFocus = false;
          modeLabel.innerHTML = 'Break Mode <i class="fas fa-cloud-sun"></i>';
          document.body.classList.replace("focus-mode", "break-mode");
          updateColors();
          timeDisplay.style.color = "var(--break-text)";
          modeLabel.style.color = "var(--break-mode-label)";
          document.querySelector(".streak").style.color = "var(--break-mode-label)";
          document.querySelector(".sessions").style.color = "var(--break-mode-label)";
          time = breakTime;
          startTimer(); // auto-start break
        } else {
          if (Notification.permission === "granted") {
            new Notification("Focus Garden", {
              body: "Break over! Back to focus 📖",
              icon: "https://cdn-icons-png.flaticon.com/512/427/427735.png"
            });
          } else {
            alert("Break over! Back to focus 📖");
          }

          isFocus = true;
          modeLabel.innerHTML = 'Focus Mode <i class="fas fa-book-open"></i>';
          document.body.classList.replace("break-mode", "focus-mode");
          updateColors();
          timeDisplay.style.color = "var(--focus-text)";
          modeLabel.style.color = "var(--accent)";
          document.querySelector(".streak").style.color = "var(--accent)";
          document.querySelector(".sessions").style.color = "var(--accent)";
          time = focusTime;
          updateDisplay();
        }
      }
    }, 500); // checks twice per second for smoother accuracy
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
  timeDisplay.style.color = "var(--focus-text)";
  modeLabel.style.color = "var(--accent)";
  document.querySelector(".streak").style.color = "var(--accent)";
  document.querySelector(".sessions").style.color = "var(--accent)";
  modeLabel.innerHTML = 'Focus Mode <i class="fas fa-book-open"></i>';
  time = focusTime;
  updateDisplay();
});

updateDisplay();
document.getElementById("streak").textContent = streak;
document.getElementById("sessions").textContent = sessionsCompleted;