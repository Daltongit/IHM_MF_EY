const views = {
    dashboard: document.getElementById("view-dashboard"),
    tasks: document.getElementById("view-tasks"),
    "add-task": document.getElementById("view-add-task")
};

const navButtons = document.querySelectorAll("[data-view]");
const goViewButtons = document.querySelectorAll("[data-go-view]");
const openAddTaskTop = document.getElementById("openAddTaskTop");
const dashboardAddBtn = document.getElementById("dashboardAddBtn");
const simulateErrorBtn = document.getElementById("simulateErrorBtn");
const taskForm = document.getElementById("taskForm");
const clearFormBtn = document.getElementById("clearFormBtn");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");
const highPriorityTasks = document.getElementById("highPriorityTasks");

const tasksContainer = document.getElementById("tasksContainer");
const recentTasks = document.getElementById("recentTasks");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");

const toast = document.getElementById("toast");
const confirmModal = document.getElementById("confirmModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const themeToggle = document.getElementById("themeToggle");

let taskIdToDelete = null;
let currentTheme = "light";

let tasks = [
    {
        id: 1,
        title: "Preparar exposición de HCI",
        description: "Organizar el contenido principal de interacción humano-computadora para la defensa.",
        date: "2026-05-30",
        priority: "Alta",
        category: "Académico",
        completed: false
    },
    {
        id: 2,
        title: "Diseñar flujo del prototipo",
        description: "Revisar navegación entre resumen, listado y formulario de tareas.",
        date: "2026-05-31",
        priority: "Media",
        category: "Trabajo",
        completed: true
    },
    {
        id: 3,
        title: "Validar accesibilidad",
        description: "Comprobar contraste, foco visible y etiquetas de formulario.",
        date: "2026-06-01",
        priority: "Alta",
        category: "Académico",
        completed: false
    }
];

function setView(viewName) {
    Object.keys(views).forEach((key) => {
        views[key].classList.toggle("view--active", key === viewName);
    });

    navButtons.forEach((button) => {
        button.classList.toggle("nav__link--active", button.dataset.view === viewName);
    });
}

navButtons.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
});

goViewButtons.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.goView));
});

openAddTaskTop.addEventListener("click", () => setView("add-task"));
dashboardAddBtn.addEventListener("click", () => setView("add-task"));

simulateErrorBtn.addEventListener("click", () => {
    showToast("Error de prueba: revisa los datos antes de continuar.", "error");
});

function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.className = "toast";
    }, 2800);
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-EC", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function updateStats() {
    const total = tasks.length;
    const pending = tasks.filter((task) => !task.completed).length;
    const completed = tasks.filter((task) => task.completed).length;
    const high = tasks.filter((task) => task.priority === "Alta").length;

    totalTasks.textContent = total;
    pendingTasks.textContent = pending;
    completedTasks.textContent = completed;
    highPriorityTasks.textContent = high;
}

function getFilteredTasks() {
    const search = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const priority = priorityFilter.value;

    return tasks.filter((task) => {
        const matchesSearch =
            task.title.toLowerCase().includes(search) ||
            task.description.toLowerCase().includes(search) ||
            task.category.toLowerCase().includes(search);

        const matchesStatus =
            status === "all" ||
            (status === "completed" && task.completed) ||
            (status === "pending" && !task.completed);

        const matchesPriority = priority === "all" || task.priority === priority;

        return matchesSearch && matchesStatus && matchesPriority;
    });
}

function createTaskCard(task, compact = false) {
    const priorityClass =
        task.priority === "Alta"
            ? "badge--high"
            : task.priority === "Media"
                ? "badge--medium"
                : "badge--low";

    const article = document.createElement("article");
    article.className = `task-card ${task.completed ? "completed" : ""}`;

    article.innerHTML = `
    <div class="task-card__top">
      <div>
        <h3 class="task-card__title">${task.title}</h3>
        <p class="task-card__description">${task.description}</p>
      </div>
    </div>

    <div class="task-card__meta">
      <span class="badge ${priorityClass}">${task.priority}</span>
      <span class="badge badge--category">${task.category}</span>
      <span class="badge ${task.completed ? "badge--completed" : "badge--pending"}">
        ${task.completed ? "Completada" : "Pendiente"}
      </span>
      <span class="badge badge--category">Entrega: ${formatDate(task.date)}</span>
    </div>

    ${compact
            ? ""
            : `
      <div class="task-card__actions">
        <button class="task-action" data-complete="${task.id}" type="button">
          ${task.completed ? "Marcar pendiente" : "Marcar completada"}
        </button>
        <button class="task-action" data-edit-view="add-task" type="button">
          Ir al formulario
        </button>
        <button class="task-action" data-delete="${task.id}" type="button">
          Eliminar
        </button>
      </div>
    `
        }
  `;

    return article;
}

function renderTasks() {
    const filtered = getFilteredTasks();
    tasksContainer.innerHTML = "";

    if (!filtered.length) {
        tasksContainer.innerHTML = `
      <div class="empty-state">
        <h3>No hay tareas para mostrar</h3>
        <p>Prueba con otro filtro o registra una nueva tarea desde el formulario.</p>
      </div>
    `;
    } else {
        filtered.forEach((task) => {
            tasksContainer.appendChild(createTaskCard(task));
        });
    }

    bindTaskActions();
}

function renderRecentTasks() {
    recentTasks.innerHTML = "";
    const recent = [...tasks].slice(-3).reverse();

    recent.forEach((task) => {
        recentTasks.appendChild(createTaskCard(task, true));
    });
}

function bindTaskActions() {
    document.querySelectorAll("[data-complete]").forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.complete);
            tasks = tasks.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task
            );

            updateUI();
            showToast("Estado de la tarea actualizado correctamente.", "success");
        });
    });

    document.querySelectorAll("[data-delete]").forEach((button) => {
        button.addEventListener("click", () => {
            taskIdToDelete = Number(button.dataset.delete);
            openModal();
        });
    });

    document.querySelectorAll("[data-edit-view]").forEach((button) => {
        button.addEventListener("click", () => {
            setView(button.dataset.editView);
            document.getElementById("title").focus();
        });
    });
}

function updateUI() {
    updateStats();
    renderTasks();
    renderRecentTasks();
}

function clearErrors() {
    ["title", "date", "description", "priority", "category"].forEach((field) => {
        document.getElementById(`${field}Error`).textContent = "";
    });
}

function validateForm(data) {
    clearErrors();
    let isValid = true;

    if (!data.title.trim()) {
        document.getElementById("titleError").textContent = "El título es obligatorio.";
        isValid = false;
    }

    if (!data.date) {
        document.getElementById("dateError").textContent = "La fecha es obligatoria.";
        isValid = false;
    }

    if (!data.description.trim()) {
        document.getElementById("descriptionError").textContent = "La descripción es obligatoria.";
        isValid = false;
    }

    if (!data.priority) {
        document.getElementById("priorityError").textContent = "Selecciona una prioridad.";
        isValid = false;
    }

    if (!data.category) {
        document.getElementById("categoryError").textContent = "Selecciona una categoría.";
        isValid = false;
    }

    return isValid;
}

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = {
        title: document.getElementById("title").value,
        date: document.getElementById("date").value,
        description: document.getElementById("description").value,
        priority: document.getElementById("priority").value,
        category: document.getElementById("category").value
    };

    if (!validateForm(data)) {
        showToast("Hay campos obligatorios pendientes.", "error");
        return;
    }

    const newTask = {
        id: Date.now(),
        ...data,
        completed: false
    };

    tasks.unshift(newTask);
    taskForm.reset();
    clearErrors();
    updateUI();
    setView("tasks");
    showToast("Tarea añadida con éxito.", "success");
});

clearFormBtn.addEventListener("click", () => {
    taskForm.reset();
    clearErrors();
    showToast("Formulario limpiado correctamente.", "info");
});

[searchInput, statusFilter, priorityFilter].forEach((element) => {
    element.addEventListener("input", renderTasks);
    element.addEventListener("change", renderTasks);
});

function openModal() {
    confirmModal.classList.add("modal--open");
    confirmModal.setAttribute("aria-hidden", "false");
    confirmDeleteBtn.focus();
}

function closeModal() {
    confirmModal.classList.remove("modal--open");
    confirmModal.setAttribute("aria-hidden", "true");
    taskIdToDelete = null;
}

confirmDeleteBtn.addEventListener("click", () => {
    if (taskIdToDelete !== null) {
        tasks = tasks.filter((task) => task.id !== taskIdToDelete);
        updateUI();
        showToast("Tarea eliminada correctamente.", "success");
    }
    closeModal();
});

cancelDeleteBtn.addEventListener("click", closeModal);

confirmModal.addEventListener("click", (event) => {
    if (event.target.dataset.closeModal === "true") {
        closeModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && confirmModal.classList.contains("modal--open")) {
        closeModal();
    }
});

themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    document.body.classList.toggle("dark", currentTheme === "dark");
    showToast(
        currentTheme === "dark" ? "Modo oscuro activado." : "Modo claro activado.",
        "info"
    );
});

updateUI();