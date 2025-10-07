let time = 25 * 60;
let timer;
let running = false;

const timeDisplay = document.getElementById("time");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");

function updateDisplay() {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

startBtn.addEventListener("click", () => {
  if (!running) {
    running = true;
    timer = setInterval(() => {
      if (time > 0) {
        time--;
        updateDisplay();
      } else {
        clearInterval(timer);
      }
    }, 1000);
  }
});

pauseBtn.addEventListener("click", () => {
  clearInterval(timer);
  running = false;
});

resetBtn.addEventListener("click", () => {
  clearInterval(timer);
  running = false;
  time = 25 * 60;
  updateDisplay();
});

updateDisplay();