const orbitalSystem = document.getElementById("orbitalSystem");
const coreOrb = document.getElementById("coreOrb");
const orbToggle = document.getElementById("orbToggle");
const themeToggle = document.getElementById("themeToggle");
const nodeButtons = document.querySelectorAll(".orb-node");
const panels = document.querySelectorAll(".view-panel");
const toastRegion = document.getElementById("toastRegion");

let menuPinned = false;
let currentTheme = document.documentElement.getAttribute("data-theme") || "dark";

function openOrbitalMenu() {
  orbitalSystem.classList.add("is-open");
  coreOrb.setAttribute("aria-expanded", "true");
  document.getElementById("orbNodes").setAttribute("aria-hidden", "false");
}

function closeOrbitalMenu() {
  if (menuPinned && window.innerWidth > 900) return;
  orbitalSystem.classList.remove("is-open");
  coreOrb.setAttribute("aria-expanded", "false");
  document.getElementById("orbNodes").setAttribute("aria-hidden", "true");
}

function toggleOrbitalMenu() {
  const isOpen = orbitalSystem.classList.contains("is-open");

  if (isOpen) {
    menuPinned = false;
    closeOrbitalMenu();
  } else {
    menuPinned = true;
    openOrbitalMenu();
  }
}

function showPanel(view) {
  panels.forEach((panel) => {
    const isTarget = panel.id === `view-${view}`;
    panel.hidden = !isTarget;
    panel.classList.toggle("is-active", isTarget);
  });

  nodeButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });

  showToast(`Vista cargada: ${capitalize(view)}`);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRegion.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2400);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

orbitalSystem.addEventListener("mouseenter", () => {
  if (window.innerWidth > 900) openOrbitalMenu();
});

orbitalSystem.addEventListener("mouseleave", () => {
  if (window.innerWidth > 900 && !menuPinned) closeOrbitalMenu();
});

coreOrb.addEventListener("click", () => {
  toggleOrbitalMenu();
});

orbToggle.addEventListener("click", () => {
  toggleOrbitalMenu();
});

nodeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    showPanel(view);

    if (window.innerWidth <= 900) {
      menuPinned = false;
      closeOrbitalMenu();
    }
  });
});

themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
  showToast(`Tema ${currentTheme === "dark" ? "oscuro" : "claro"} activado`);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900 && !menuPinned) {
    closeOrbitalMenu();
  }
});

showPanel("dashboard");
applyTheme(currentTheme);
