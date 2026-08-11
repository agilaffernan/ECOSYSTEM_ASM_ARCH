document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".diagram-frame a").forEach((link) => {
    link.setAttribute("title", "Open the diagram at full size");
  });
});
