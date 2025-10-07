let focusTime = 5;
let breakTime = 5;
let time = focusTime;
let timer;
let running = false;
let isFocus = true;

const timeDisplay = document.getElementById("time");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const modeLabel = document.getElementById("mode-label");

document.body.classList.add("focus-mode");

if ("Notification" in window) {
  Notification.requestPermission();
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
    timer = setInterval(() => {
      if (time > 0) {
        time--;
        updateDisplay();
      } else {
        clearInterval(timer);
        running = false;

        if (isFocus) {
          if (Notification.permission === "granted") {
            new Notification("Focus Garden", {
            body: "Focus session complete! Time for a 5-minute break ☁️",
            icon: "https://cdn-icons-png.flaticon.com/512/427/427735.png" // optional cute icon
            });
          } else {
            alert("Focus session complete! Time for a 5-minute break ☁️");
          }
          isFocus = false;
          modeLabel.innerHTML = 'Break Mode <i class="fas fa-cloud-sun"></i>';
          document.body.classList.replace("focus-mode", "break-mode");
          timeDisplay.style.color = "var(--break-text)";
          modeLabel.style.color = "var(--break-text)";
          time = breakTime;
          startTimer();
        } else {
          if (Notification.permission === "granted") {
            new Notification("Focus Garden", {
            body: "Break over! Back to focus 📖",
            icon: "https://cdn-icons-png.flaticon.com/512/427/427735.png" // optional cute icon
            });
          } else {
            alert("Break over! Back to focus 📖");
          }
          isFocus = true;
          modeLabel.innerHTML = 'Focus Mode <i class="fas fa-book-open"></i>';
          document.body.classList.replace("break-mode", "focus-mode");
          timeDisplay.style.color = "var(--focus-text)";
          modeLabel.style.color = "var(--accent)";
          time = focusTime;
          updateDisplay();
        }
      }
    }, 1000);
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
  timeDisplay.style.color = "var(--focus-text)";
  modeLabel.style.color = "var(--accent)";
  modeLabel.innerHTML = 'Focus Mode <i class="fas fa-book-open"></i>';
  time = focusTime;
  updateDisplay();
});

updateDisplay();

