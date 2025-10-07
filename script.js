let focusTime = 25 * 60;
let breakTime = 5 * 60;
let time = focusTime;
let timer;
let running = false;
let isFocus = true;

const timeDisplay = document.getElementById("time");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");

const modeLabel = document.getElementById("mode-label");

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
          alert("Focus session complete! Time for a 5-minute break 🌿");
          isFocus = false;
          modeLabel.textContent = "Break Mode 🌿";
          time = breakTime;
          startTimer(); // auto-start break
        } else {
          alert("Break over! Back to focus 🌱");
          isFocus = true;
          modeLabel.textContent = "Focus Mode 🌱";
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
  modeLabel.textContent = "Focus Mode 🌱";
  time = focusTime;
  updateDisplay();
});

updateDisplay();

