const navTriggers = document.querySelectorAll(".nav-trigger");
const moduleCards = document.querySelectorAll(".module-card");
const panels = document.querySelectorAll(".view-panel");
const themeToggle = document.getElementById("themeToggle");
const toastRegion = document.getElementById("toastRegion");
const taskForm = document.getElementById("taskForm");

let currentTheme = document.documentElement.getAttribute("data-theme") || "dark";

function showView(view) {
  panels.forEach((panel) => {
    const active = panel.id === `view-${view}`;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });

  moduleCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.view === view);
  });

  showToast(`Vista activa: ${capitalize(view)}`);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRegion.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2200);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

navTriggers.forEach((button) => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
  showToast(`Tema ${currentTheme === "dark" ? "oscuro" : "claro"} activado`);
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = document.getElementById("title");
  const category = document.getElementById("category");
  const description = document.getElementById("description");
  const priority = document.getElementById("priority");
  const date = document.getElementById("date");

  const errorTitle = document.getElementById("error-title");
  const errorCategory = document.getElementById("error-category");
  const errorDescription = document.getElementById("error-description");
  const errorPriority = document.getElementById("error-priority");
  const errorDate = document.getElementById("error-date");

  errorTitle.textContent = "";
  errorCategory.textContent = "";
  errorDescription.textContent = "";
  errorPriority.textContent = "";
  errorDate.textContent = "";

  let valid = true;

  if (title.value.trim().length < 3) {
    errorTitle.textContent = "El título debe tener al menos 3 caracteres.";
    valid = false;
  }

  if (!category.value.trim()) {
    errorCategory.textContent = "La categoría es obligatoria.";
    valid = false;
  }

  if (description.value.trim().length < 10) {
    errorDescription.textContent = "La descripción debe tener al menos 10 caracteres.";
    valid = false;
  }

  if (!priority.value) {
    errorPriority.textContent = "Selecciona una prioridad.";
    valid = false;
  }

  if (!date.value) {
    errorDate.textContent = "Selecciona una fecha.";
    valid = false;
  }

  if (!valid) {
    showToast("Corrige los campos marcados.");
    return;
  }

  taskForm.reset();
  showToast("Tarea añadida con éxito.");
  showView("tasks");
});

showView("home");
applyTheme(currentTheme);
