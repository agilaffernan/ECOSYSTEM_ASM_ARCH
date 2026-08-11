const stage = document.querySelector("#viewer-stage");
const image = document.querySelector("#diagram-image");
const error = document.querySelector("#viewer-error");
const title = document.querySelector("#viewer-title");
const zoomValue = document.querySelector("#zoom-value");
const rawLink = document.querySelector("#raw-svg-link");

const params = new URLSearchParams(window.location.search);
const requestedSource = params.get("src") || "";
const requestedTitle = params.get("title") || "Architecture diagram";
const validSource = /^diagrams\/[a-zA-Z0-9._-]+\.svg$/.test(requestedSource);

let scale = 1;
let fitScale = 1;
let translateX = 0;
let translateY = 0;
let fitted = true;
let dragging = false;
let pointerX = 0;
let pointerY = 0;

function dimensions() {
  return {
    width: image.naturalWidth || 1,
    height: image.naturalHeight || 1
  };
}

function render() {
  image.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  zoomValue.value = `${Math.round(scale * 100)}%`;
  zoomValue.textContent = fitted ? `Fit ${Math.round(scale * 100)}%` : `${Math.round(scale * 100)}%`;
}

function fitToScreen() {
  const size = dimensions();
  const padding = stage.clientWidth < 700 ? 12 : 28;
  fitScale = Math.min(
    (stage.clientWidth - padding * 2) / size.width,
    (stage.clientHeight - padding * 2) / size.height
  );
  scale = Math.max(0.01, fitScale);
  translateX = (stage.clientWidth - size.width * scale) / 2;
  translateY = (stage.clientHeight - size.height * scale) / 2;
  fitted = true;
  render();
  image.classList.add("is-ready");
}

function zoomAt(factor, centerX = stage.clientWidth / 2, centerY = stage.clientHeight / 2) {
  const minimum = Math.max(0.01, fitScale * 0.5);
  const maximum = Math.max(4, fitScale * 16);
  const nextScale = Math.min(maximum, Math.max(minimum, scale * factor));
  translateX = centerX - ((centerX - translateX) * nextScale) / scale;
  translateY = centerY - ((centerY - translateY) * nextScale) / scale;
  scale = nextScale;
  fitted = false;
  render();
}

function goBack() {
  if (window.history.length > 1) window.history.back();
  else window.location.href = "index.html";
}

document.querySelector("#back-button").addEventListener("click", goBack);
document.querySelector("#zoom-in-button").addEventListener("click", () => zoomAt(1.2));
document.querySelector("#zoom-out-button").addEventListener("click", () => zoomAt(1 / 1.2));
document.querySelector("#fit-button").addEventListener("click", fitToScreen);
document.querySelector("#fullscreen-button").addEventListener("click", async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
});

stage.addEventListener("wheel", (event) => {
  event.preventDefault();
  const bounds = stage.getBoundingClientRect();
  zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX - bounds.left, event.clientY - bounds.top);
}, { passive: false });

stage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  dragging = true;
  fitted = false;
  pointerX = event.clientX;
  pointerY = event.clientY;
  stage.classList.add("dragging");
  stage.setPointerCapture(event.pointerId);
});

stage.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  translateX += event.clientX - pointerX;
  translateY += event.clientY - pointerY;
  pointerX = event.clientX;
  pointerY = event.clientY;
  render();
});

function endDrag(event) {
  dragging = false;
  stage.classList.remove("dragging");
  if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
}

stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);
stage.addEventListener("dblclick", fitToScreen);

window.addEventListener("resize", () => {
  if (fitted) fitToScreen();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !document.fullscreenElement) goBack();
  if (event.key === "+" || event.key === "=") zoomAt(1.2);
  if (event.key === "-") zoomAt(1 / 1.2);
  if (event.key === "0") fitToScreen();
});

if (!validSource) {
  image.hidden = true;
  error.hidden = false;
} else {
  title.textContent = requestedTitle;
  document.title = `${requestedTitle} | ASM+ Architecture`;
  image.alt = requestedTitle;
  image.addEventListener("load", fitToScreen, { once: true });
  image.addEventListener("error", () => {
    image.hidden = true;
    error.hidden = false;
  }, { once: true });
  rawLink.href = requestedSource;
  image.src = requestedSource;
}
