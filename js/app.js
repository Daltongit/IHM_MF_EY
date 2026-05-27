const { createClient } = window.supabase;
const supabaseClient = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const TABLE = window.SUPABASE_TABLE;

const state = {
  view: "dashboard",
  theme: document.documentElement.getAttribute("data-theme") || "dark",
  filters: {
    search: "",
    state: "all"
  },
  tasks: [],
  editingId: null
};

const elements = {
  railLinks: document.querySelectorAll(".rail-link"),
  quickNavButtons: document.querySelectorAll("[data-quick-nav]"),
  views: {
    dashboard: document.getElementById("view-dashboard"),
    board: document.getElementById("view-board"),
    studio: document.getElementById("view-studio")
  },
  viewTitle: document.getElementById("viewTitle"),
  themeToggle: document.getElementById("themeToggle"),
  searchInput: document.getElementById("searchInput"),
  stateFilter: document.getElementById("stateFilter"),
  metricTotal: document.getElementById("metricTotal"),
  metricActive: document.getElementById("metricActive"),
  metricComplete: document.getElementById("metricComplete"),
  averageFocus: document.getElementById("averageFocus"),
  focusMeterFill: document.getElementById("focusMeterFill"),
  miniFacts: document.getElementById("miniFacts"),
  recentList: document.getElementById("recentList"),
  laneBacklog: document.getElementById("laneBacklog"),
  laneActive: document.getElementById("laneActive"),
  laneComplete: document.getElementById("laneComplete"),
  countBacklog: document.getElementById("countBacklog"),
  countActive: document.getElementById("countActive"),
  countComplete: document.getElementById("countComplete"),
  taskForm: document.getElementById("taskForm"),
  formTitle: document.getElementById("formTitle"),
  resetFormBtn: document.getElementById("resetFormBtn"),
  taskId: document.getElementById("taskId"),
  title: document.getElementById("title"),
  category: document.getElementById("category"),
  summary: document.getElementById("summary"),
  owner: document.getElementById("owner"),
  taskState: document.getElementById("state"),
  priority: document.getElementById("priority"),
  focus: document.getElementById("focus"),
  dueDate: document.getElementById("dueDate"),
  previewTitle: document.getElementById("previewTitle"),
  previewSummary: document.getElementById("previewSummary"),
  previewCategory: document.getElementById("previewCategory"),
  previewOwner: document.getElementById("previewOwner"),
  previewPriority: document.getElementById("previewPriority"),
  previewFocus: document.getElementById("previewFocus"),
  previewState: document.getElementById("previewState"),
  detailDialog: document.getElementById("detailDialog"),
  detailTitle: document.getElementById("detailTitle"),
  detailBody: document.getElementById("detailBody"),
  closeDetailBtn: document.getElementById("closeDetailBtn"),
  toastRegion: document.getElementById("toastRegion"),
  srStatus: document.getElementById("srStatus")
};

const errors = {
  title: document.getElementById("error-title"),
  category: document.getElementById("error-category"),
  summary: document.getElementById("error-summary"),
  owner: document.getElementById("error-owner"),
  priority: document.getElementById("error-priority"),
  focus: document.getElementById("error-focus")
};

const viewLabels = {
  dashboard: "Pulse / resumen operativo",
  board: "Board / estados y flujo",
  studio: "Studio / crear o editar"
};

const nextStateMap = {
  backlog: "active",
  active: "complete",
  complete: "backlog"
};

init();

async function init() {
  bindEvents();
  applyTheme(state.theme);
  syncPreview();
  await loadTasks();
}

function bindEvents() {
  elements.railLinks.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  elements.quickNavButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.quickNav));
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    renderAll();
  });

  elements.stateFilter.addEventListener("change", (event) => {
    state.filters.state = event.target.value;
    renderAll();
  });

  elements.themeToggle.addEventListener("click", toggleTheme);

  elements.taskForm.addEventListener("submit", handleSubmit);
  elements.resetFormBtn.addEventListener("click", resetForm);

  [
    elements.title,
    elements.category,
    elements.summary,
    elements.owner,
    elements.taskState,
    elements.priority,
    elements.focus,
    elements.dueDate
  ].forEach((field) => {
    field.addEventListener("input", syncPreview);
    field.addEventListener("change", syncPreview);
  });

  elements.laneBacklog.addEventListener("click", handleTaskAction);
  elements.laneActive.addEventListener("click", handleTaskAction);
  elements.laneComplete.addEventListener("click", handleTaskAction);

  elements.closeDetailBtn.addEventListener("click", () => elements.detailDialog.close());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.detailDialog.open) {
      elements.detailDialog.close();
    }
  });
}

async function loadTasks() {
  const { data, error } = await supabaseClient
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showToast("No se pudieron cargar las tareas desde Supabase.", "error");
    announce("Error al cargar las tareas.");
    return;
  }

  state.tasks = data || [];
  renderAll();
  showToast("Sincronización completada.", "info");
}

function renderAll() {
  renderMetrics();
  renderMiniFacts();
  renderRecent();
  renderBoard();
}

function showView(view) {
  state.view = view;

  Object.entries(elements.views).forEach(([key, section]) => {
    const active = key === view;
    section.hidden = !active;
    section.classList.toggle("is-active", active);
  });

  elements.railLinks.forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    active ? button.setAttribute("aria-current", "page") : button.removeAttribute("aria-current");
  });

  elements.viewTitle.textContent = viewLabels[view] || "PulseBoard";

  if (view === "studio") {
    setTimeout(() => elements.title.focus(), 50);
  }

  announce(`Vista actual: ${viewLabels[view]}`);
}

function renderMetrics() {
  const total = state.tasks.length;
  const active = state.tasks.filter((task) => task.state === "active").length;
  const complete = state.tasks.filter((task) => task.state === "complete").length;
  const averageFocus = total
    ? Math.round(state.tasks.reduce((sum, task) => sum + Number(task.focus_score || 0), 0) / total)
    : 0;

  elements.metricTotal.textContent = total;
  elements.metricActive.textContent = active;
  elements.metricComplete.textContent = complete;
  elements.averageFocus.textContent = `${averageFocus}%`;
  elements.focusMeterFill.style.width = `${averageFocus}%`;
}

function renderMiniFacts() {
  const tasks = state.tasks;
  const backlog = tasks.filter((task) => task.state === "backlog").length;
  const nextDeadline = [...tasks]
    .filter((task) => task.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

  const highestPriority = [...tasks].sort((a, b) => b.priority_level - a.priority_level)[0];

  const facts = [
    {
      title: "Backlog pendiente",
      text: backlog ? `${backlog} tarea(s) esperando activación.` : "No hay tareas pendientes en backlog."
    },
    {
      title: "Próxima fecha",
      text: nextDeadline
        ? `${nextDeadline.title} vence el ${formatDate(nextDeadline.due_date)}.`
        : "No hay fechas límite registradas."
    },
    {
      title: "Mayor prioridad",
      text: highestPriority
        ? `${highestPriority.title} tiene prioridad ${highestPriority.priority_level}.`
        : "Aún no existe una tarea destacada."
    }
  ];

  elements.miniFacts.innerHTML = facts
    .map(
      (fact) => `
        <article class="fact-chip">
          <strong>${escapeHTML(fact.title)}</strong>
          <span>${escapeHTML(fact.text)}</span>
        </article>
      `
    )
    .join("");
}

function renderRecent() {
  const tasks = [...state.tasks].slice(0, 5);

  if (!tasks.length) {
    elements.recentList.innerHTML = `
      <article class="recent-item">
        <strong>No hay actividad todavía</strong>
        <span>Crea la primera tarea desde el Studio.</span>
      </article>
    `;
    return;
  }

  elements.recentList.innerHTML = tasks
    .map((task) => {
      const statusText = task.stateLabel || normalizeStateLabel(task.state);
      return `
        <article class="recent-item">
          <strong>${escapeHTML(task.title)}</strong>
          <span>${escapeHTML(task.category)} · ${statusText} · ${escapeHTML(task.owner_name || "Sin asignar")}</span>
        </article>
      `;
    })
    .join("");
}

function getFilteredTasks() {
  return state.tasks.filter((task) => {
    const searchTarget = `${task.title} ${task.category} ${task.owner_name} ${task.summary}`.toLowerCase();
    const matchesSearch = searchTarget.includes(state.filters.search);
    const matchesState = state.filters.state === "all" || task.state === state.filters.state;
    return matchesSearch && matchesState;
  });
}

function renderBoard() {
  const filtered = getFilteredTasks();
  const grouped = {
    backlog: filtered.filter((task) => task.state === "backlog"),
    active: filtered.filter((task) => task.state === "active"),
    complete: filtered.filter((task) => task.state === "complete")
  };

  elements.countBacklog.textContent = grouped.backlog.length;
  elements.countActive.textContent = grouped.active.length;
  elements.countComplete.textContent = grouped.complete.length;

  elements.laneBacklog.innerHTML = renderLane(grouped.backlog);
  elements.laneActive.innerHTML = renderLane(grouped.active);
  elements.laneComplete.innerHTML = renderLane(grouped.complete);

  animateBars();
}

function renderLane(tasks) {
  if (!tasks.length) {
    return `<div class="empty-lane">No hay tareas en este estado con el filtro actual.</div>`;
  }

  return tasks
    .map((task) => {
      const label = normalizeStateLabel(task.state);
      const nextLabel = normalizeStateLabel(nextStateMap[task.state]);

      return `
        <article class="task-card" aria-label="Tarea ${escapeHTML(task.title)}">
          <div class="task-head">
            <h5>${escapeHTML(task.title)}</h5>
            <span class="task-pill task-pill--${escapeHTML(task.state)}">${label}</span>
          </div>

          <p class="task-summary">${escapeHTML(task.summary)}</p>

          <div class="task-meta">
            <span class="task-pill">${escapeHTML(task.category)}</span>
            <span class="task-pill">${escapeHTML(task.owner_name || "Sin asignar")}</span>
            <span class="task-pill">P${Number(task.priority_level)}</span>
            <span class="task-pill">${task.due_date ? formatDate(task.due_date) : "Sin fecha"}</span>
          </div>

          <div class="task-progress">
            <span><b>Focus score</b><b>${Number(task.focus_score)}%</b></span>
            <div class="bar"><i style="width:${Number(task.focus_score)}%"></i></div>
          </div>

          <div class="task-actions">
            <button class="task-btn" type="button" data-action="details" data-id="${task.id}">Detalle</button>
            <button class="task-btn task-btn--accent" type="button" data-action="advance" data-id="${task.id}">
              Mover a ${nextLabel}
            </button>
            <button class="task-btn" type="button" data-action="edit" data-id="${task.id}">Editar</button>
            <button class="task-btn task-btn--danger" type="button" data-action="delete" data-id="${task.id}">Eliminar</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function handleTaskAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;
  const task = state.tasks.find((item) => item.id === id);

  if (!task) return;

  if (action === "details") {
    openDetails(task);
  }

  if (action === "edit") {
    startEdit(task);
  }

  if (action === "advance") {
    advanceTask(task);
  }

  if (action === "delete") {
    removeTask(task);
  }
}

async function advanceTask(task) {
  const nextState = nextStateMap[task.state];

  const { error } = await supabaseClient
    .from(TABLE)
    .update({ state: nextState })
    .eq("id", task.id);

  if (error) {
    console.error(error);
    showToast("No se pudo mover la tarea.", "error");
    return;
  }

  showToast(`La tarea pasó a ${normalizeStateLabel(nextState)}.`, "success");
  announce(`La tarea ${task.title} fue movida a ${normalizeStateLabel(nextState)}.`);
  await loadTasks();
}

function startEdit(task) {
  state.editingId = task.id;
  elements.formTitle.textContent = "Editar tarea";
  elements.taskId.value = task.id;
  elements.title.value = task.title || "";
  elements.category.value = task.category || "";
  elements.summary.value = task.summary || "";
  elements.owner.value = task.owner_name || "";
  elements.taskState.value = task.state || "backlog";
  elements.priority.value = task.priority_level ?? 3;
  elements.focus.value = task.focus_score ?? 60;
  elements.dueDate.value = task.due_date || "";
  syncPreview();
  clearErrors();
  showView("studio");
  showToast("Modo edición activado.", "info");
}

async function removeTask(task) {
  const confirmDelete = window.confirm(`¿Eliminar la tarea "${task.title}"?`);
  if (!confirmDelete) return;

  const { error } = await supabaseClient
    .from(TABLE)
    .delete()
    .eq("id", task.id);

  if (error) {
    console.error(error);
    showToast("No se pudo eliminar la tarea.", "error");
    return;
  }

  showToast("Tarea eliminada.", "success");
  announce(`Tarea ${task.title} eliminada.`);
  await loadTasks();
}

async function handleSubmit(event) {
  event.preventDefault();
  clearErrors();

  const payload = {
    title: elements.title.value.trim(),
    category: elements.category.value.trim(),
    summary: elements.summary.value.trim(),
    owner_name: elements.owner.value.trim() || "Sin asignar",
    state: elements.taskState.value,
    priority_level: Number(elements.priority.value),
    focus_score: Number(elements.focus.value),
    due_date: elements.dueDate.value || null
  };

  if (!validate(payload)) {
    showToast("Corrige los campos marcados antes de guardar.", "error");
    return;
  }

  let response;

  if (state.editingId) {
    response = await supabaseClient
      .from(TABLE)
      .update(payload)
      .eq("id", state.editingId);
  } else {
    response = await supabaseClient
      .from(TABLE)
      .insert(payload);
  }

  if (response.error) {
    console.error(response.error);
    showToast("No se pudo guardar la tarea.", "error");
    return;
  }

  showToast(state.editingId ? "Tarea actualizada." : "Tarea creada.", "success");
  announce(state.editingId ? "Tarea actualizada." : "Tarea creada.");
  resetForm();
  await loadTasks();
  showView("board");
}

function validate(payload) {
  let isValid = true;

  if (payload.title.length < 3) {
    errors.title.textContent = "El título debe tener al menos 3 caracteres.";
    isValid = false;
  }

  if (!payload.category) {
    errors.category.textContent = "La categoría es obligatoria.";
    isValid = false;
  }

  if (payload.summary.length < 10) {
    errors.summary.textContent = "El resumen debe tener al menos 10 caracteres.";
    isValid = false;
  }

  if (payload.owner_name.length < 2) {
    errors.owner.textContent = "El responsable debe tener al menos 2 caracteres.";
    isValid = false;
  }

  if (payload.priority_level < 1 || payload.priority_level > 5 || Number.isNaN(payload.priority_level)) {
    errors.priority.textContent = "La prioridad debe estar entre 1 y 5.";
    isValid = false;
  }

  if (payload.focus_score < 0 || payload.focus_score > 100 || Number.isNaN(payload.focus_score)) {
    errors.focus.textContent = "El focus score debe estar entre 0 y 100.";
    isValid = false;
  }

  return isValid;
}

function clearErrors() {
  Object.values(errors).forEach((node) => {
    node.textContent = "";
  });
}

function resetForm() {
  state.editingId = null;
  elements.formTitle.textContent = "Crear nueva tarea";
  elements.taskForm.reset();
  elements.priority.value = 3;
  elements.focus.value = 60;
  elements.taskState.value = "backlog";
  elements.taskId.value = "";
  clearErrors();
  syncPreview();
}

function syncPreview() {
  elements.previewTitle.textContent = elements.title.value.trim() || "Título de la tarea";
  elements.previewSummary.textContent = elements.summary.value.trim() || "El resumen aparecerá aquí cuando empieces a escribir.";
  elements.previewCategory.textContent = elements.category.value.trim() || "Sin categoría";
  elements.previewOwner.textContent = elements.owner.value.trim() || "Sin responsable";
  elements.previewPriority.textContent = `Prioridad ${elements.priority.value || 3}`;
  elements.previewFocus.textContent = `Focus ${elements.focus.value || 60}`;
  elements.previewState.textContent = normalizeStateLabel(elements.taskState.value || "backlog");
  elements.previewState.className = `task-pill task-pill--${elements.taskState.value || "backlog"}`;
}

function openDetails(task) {
  elements.detailTitle.textContent = task.title;
  elements.detailBody.innerHTML = `
    <article class="detail-block">
      <strong>Resumen</strong>
      <span>${escapeHTML(task.summary)}</span>
    </article>
    <article class="detail-block">
      <strong>Categoría</strong>
      <span>${escapeHTML(task.category)}</span>
    </article>
    <article class="detail-block">
      <strong>Responsable</strong>
      <span>${escapeHTML(task.owner_name || "Sin asignar")}</span>
    </article>
    <article class="detail-block">
      <strong>Estado</strong>
      <span>${escapeHTML(normalizeStateLabel(task.state))}</span>
    </article>
    <article class="detail-block">
      <strong>Prioridad</strong>
      <span>${Number(task.priority_level)}</span>
    </article>
    <article class="detail-block">
      <strong>Focus score</strong>
      <span>${Number(task.focus_score)}%</span>
    </article>
    <article class="detail-block">
      <strong>Fecha límite</strong>
      <span>${task.due_date ? formatDate(task.due_date) : "Sin fecha"}</span>
    </article>
  `;
  elements.detailDialog.showModal();
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme(state.theme);
  showToast(`Tema ${state.theme === "dark" ? "oscuro" : "claro"} activado.`, "info");
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  elements.toastRegion.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2800);
}

function announce(message) {
  elements.srStatus.textContent = "";
  setTimeout(() => {
    elements.srStatus.textContent = message;
  }, 30);
}

function normalizeStateLabel(value) {
  const labels = {
    backlog: "Backlog",
    active: "Active",
    complete: "Complete"
  };
  return labels[value] || "Estado";
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateString}T00:00:00`));
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function animateBars() {
  document.querySelectorAll(".task-progress .bar > i").forEach((bar) => {
    const width = bar.style.width;
    bar.style.width = "0";
    requestAnimationFrame(() => {
      bar.style.transition = "width .45s cubic-bezier(.2,.8,.2,1)";
      bar.style.width = width;
    });
  });
}
