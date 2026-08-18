document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".diagram-open-link").forEach((link) => {
    link.setAttribute("title", "Open the diagram at full size");
  });
});
