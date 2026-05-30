const stage = document.querySelector("#stage");
const closeButton = document.querySelector(".close-button");
const label = document.querySelector(".mode-label");
const speech = document.querySelector(".speech");

const modes = [
  { id: "idle", label: "呼吸待机", speech: "我在桌面上等你。" },
  { id: "walk", label: "桌面巡视", speech: "我去屏幕边上看一圈。" },
  { id: "alert", label: "异常提醒", speech: "早餐剩了 20g，我有点想散步。" },
  { id: "happy", label: "互动开心", speech: "你点到我啦，今天也一起守护零食柜。" }
];

let index = 0;

closeButton.addEventListener("click", () => {
  window.desktopPhotoPet?.close();
});

stage.addEventListener("click", () => {
  setMode((index + 1) % modes.length);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") window.desktopPhotoPet?.close();
  const n = Number(event.key);
  if (n >= 1 && n <= modes.length) setMode(n - 1);
});

setMode(0);
setInterval(() => setMode((index + 1) % modes.length), 5600);

function setMode(nextIndex) {
  index = nextIndex;
  const mode = modes[index];
  stage.className = `mode-${mode.id}`;
  label.textContent = `photo-real sprite · ${mode.label}`;
  speech.textContent = mode.speech;
}
