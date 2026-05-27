const { createClient } = window.supabase;
const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const state = {
  view: "home",
  cases: [],
  filters: {
    search: "",
    color: "all",
    status: "all"
  },
  currentInference: null
};

const el = {
  navCards: document.querySelectorAll(".nav-card"),
  navButtons: document.querySelectorAll(".nav-btn"),
  views: {
    home: document.getElementById("view-home"),
    triage: document.getElementById("view-triage"),
    queue: document.getElementById("view-queue")
  },
  statRed: document.getElementById("statRed"),
  statYellow: document.getElementById("statYellow"),
  statGreen: document.getElementById("statGreen"),
  statWaiting: document.getElementById("statWaiting"),
  lineRed: document.getElementById("lineRed"),
  lineYellow: document.getElementById("lineYellow"),
  lineGreen: document.getElementById("lineGreen"),
  lineWaiting: document.getElementById("lineWaiting"),
  triageForm: document.getElementById("triageForm"),
  patientName: document.getElementById("patientName"),
  patientAge: document.getElementById("patientAge"),
  chiefComplaint: document.getElementById("chiefComplaint"),
  breathingLevel: document.getElementById("breathingLevel"),
  mentalState: document.getElementById("mentalState"),
  painLevel: document.getElementById("painLevel"),
  painValue: document.getElementById("painValue"),
  severeBleeding: document.getElementById("severeBleeding"),
  chestPain: document.getElementById("chestPain"),
  fever: document.getElementById("fever"),
  trauma: document.getElementById("trauma"),
  notes: document.getElementById("notes"),
  inferBtn: document.getElementById("inferBtn"),
  resetBtn: document.getElementById("resetBtn"),
  inferenceCard: document.getElementById("inferenceCard"),
  searchCase: document.getElementById("searchCase"),
  filterColor: document.getElementById("filterColor"),
  filterStatus: document.getElementById("filterStatus"),
  queueList: document.getElementById("queueList"),
  detailDialog: document.getElementById("detailDialog"),
  detailTitle: document.getElementById("detailTitle"),
  detailBody: document.getElementById("detailBody"),
  closeDialogBtn: document.getElementById("closeDialogBtn"),
  toastRegion: document.getElementById("toastRegion"),
  srStatus: document.getElementById("srStatus")
};

const errorMap = {
  patientName: document.getElementById("error-patientName"),
  patientAge: document.getElementById("error-patientAge"),
  chiefComplaint: document.getElementById("error-chiefComplaint"),
  canWalk: document.getElementById("error-canWalk")
};

init();

async function init() {
  bindEvents();
  syncSelectableStates();
  el.painValue.textContent = el.painLevel.value;
  observeReveal();
  await loadCases();
}

function bindEvents() {
  el.navCards.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  el.navButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  [
    el.patientName,
    el.patientAge,
    el.chiefComplaint,
    el.breathingLevel,
    el.mentalState,
    el.painLevel,
    el.severeBleeding,
    el.chestPain,
    el.fever,
    el.trauma,
    el.notes,
    ...document.querySelectorAll('input[name="canWalk"]')
  ].forEach((node) => {
    node.addEventListener("input", handleFormChange);
    node.addEventListener("change", handleFormChange);
  });

  el.inferBtn.addEventListener("click", () => {
    updateInference(true);
  });

  el.resetBtn.addEventListener("click", resetForm);

  el.triageForm.addEventListener("submit", handleSubmit);

  el.searchCase.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    renderQueue();
  });

  el.filterColor.addEventListener("change", (event) => {
    state.filters.color = event.target.value;
    renderQueue();
  });

  el.filterStatus.addEventListener("change", (event) => {
    state.filters.status = event.target.value;
    renderQueue();
  });

  el.queueList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "detail") {
      openCaseDetail(id);
    }

    if (action === "start") {
      await changeCaseStatus(id, "in_progress");
    }

    if (action === "finish") {
      await changeCaseStatus(id, "attended");
    }

    if (action === "reopen") {
      await changeCaseStatus(id, "waiting");
    }
  });

  el.closeDialogBtn.addEventListener("click", () => el.detailDialog.close());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && el.detailDialog.open) {
      el.detailDialog.close();
    }
  });
}

function handleFormChange() {
  el.painValue.textContent = el.painLevel.value;
  syncSelectableStates();
  updateInference(false);
}

function syncSelectableStates() {
  document.querySelectorAll(".choice-card").forEach((card) => {
    const input = card.querySelector("input");
    card.classList.toggle("selected", input.checked);
  });

  document.querySelectorAll(".check-chip").forEach((chip) => {
    const input = chip.querySelector("input");
    chip.classList.toggle("selected", input.checked);
  });
}

async function loadCases() {
  const { data, error } = await supabase
    .from(window.TABLES.cases)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showToast("No se pudieron cargar los casos.", "error");
    announce("Error al cargar los casos.");
    return;
  }

  state.cases = data || [];
  renderAll();
}

function renderAll() {
  renderHome();
  renderQueue();
  updateInference(false);
}

function showView(view) {
  state.view = view;

  Object.entries(el.views).forEach(([key, section]) => {
    const active = key === view;
    section.hidden = !active;
    section.classList.toggle("is-active", active);
  });

  el.navCards.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });

  announce(`Vista activa: ${view}`);
}

function getFormData() {
  const selectedWalk = document.querySelector('input[name="canWalk"]:checked');

  return {
    patient_name: el.patientName.value.trim(),
    age: Number(el.patientAge.value),
    chief_complaint: el.chiefComplaint.value.trim(),
    can_walk: selectedWalk ? selectedWalk.value === "yes" : null,
    breathing_level: el.breathingLevel.value,
    severe_bleeding: el.severeBleeding.checked,
    chest_pain: el.chestPain.checked,
    mental_state: el.mentalState.value,
    pain_level: Number(el.painLevel.value),
    fever: el.fever.checked,
    trauma: el.trauma.checked,
    notes: el.notes.value.trim()
  };
}

function validateForm(data) {
  const errors = {};

  if (data.patient_name.length < 3) {
    errors.patientName = "Ingresa un nombre válido.";
  }

  if (!Number.isInteger(data.age) || data.age < 0 || data.age > 120) {
    errors.patientAge = "Ingresa una edad válida.";
  }

  if (data.chief_complaint.length < 4) {
    errors.chiefComplaint = "Describe el motivo principal.";
  }

  if (data.can_walk === null) {
    errors.canWalk = "Selecciona si el paciente puede caminar.";
  }

  return errors;
}

function clearErrors() {
  Object.values(errorMap).forEach((node) => {
    node.textContent = "";
  });
}

function setErrors(errors) {
  Object.entries(errors).forEach(([key, message]) => {
    if (errorMap[key]) {
      errorMap[key].textContent = message;
    }
  });
}

function inferTriage(data) {
  let score = 0;
  const reasons = [];

  if (data.can_walk === false) {
    score += 18;
    reasons.push("Paciente no deambula por sí mismo.");
  } else {
    score += 4;
    reasons.push("Paciente deambula.");
  }

  if (data.breathing_level === "moderate") {
    score += 22;
    reasons.push("Dificultad respiratoria moderada.");
  }

  if (data.breathing_level === "severe") {
    score += 45;
    reasons.push("Dificultad respiratoria severa.");
  }

  if (data.severe_bleeding) {
    score += 50;
    reasons.push("Sangrado severo detectado.");
  }

  if (data.chest_pain) {
    score += 35;
    reasons.push("Dolor torácico reportado.");
  }

  if (data.mental_state === "confused") {
    score += 22;
    reasons.push("Estado mental confuso.");
  }

  if (data.mental_state === "unresponsive") {
    score += 50;
    reasons.push("Paciente no responde.");
  }

  if (data.trauma) {
    score += 15;
    reasons.push("Trauma reportado.");
  }

  if (data.fever) {
    score += 8;
    reasons.push("Fiebre reportada.");
  }

  if (data.pain_level >= 9) {
    score += 25;
    reasons.push(`Dolor extremo ${data.pain_level}/10.`);
  } else if (data.pain_level >= 6) {
    score += 15;
    reasons.push(`Dolor alto ${data.pain_level}/10.`);
  } else if (data.pain_level >= 3) {
    score += 7;
    reasons.push(`Dolor leve a moderado ${data.pain_level}/10.`);
  }

  score = Math.min(100, score);

  let color = "green";
  let label = "Verde · Demorable";

  const hasRedFlag =
    data.severe_bleeding ||
    data.chest_pain ||
    data.breathing_level === "severe" ||
    data.mental_state === "unresponsive";

  const hasYellowFlag =
    data.breathing_level === "moderate" ||
    data.mental_state === "confused" ||
    data.can_walk === false ||
    data.trauma ||
    data.pain_level >= 6;

  if (hasRedFlag || score >= 70) {
    color = "red";
    label = "Rojo · Inmediato";
  } else if (hasYellowFlag || score >= 35) {
    color = "yellow";
    label = "Amarillo · Urgente";
  }

  return {
    color,
    label,
    score,
    reasons: uniqueReasons(reasons).slice(0, 5)
  };
}

function uniqueReasons(list) {
  return [...new Set(list)];
}

function updateInference(forceMessage) {
  const data = getFormData();
  const hasMeaningfulInput =
    data.patient_name ||
    data.chief_complaint ||
    data.pain_level > 0 ||
    data.severe_bleeding ||
    data.chest_pain ||
    data.fever ||
    data.trauma ||
    data.breathing_level !== "none" ||
    data.mental_state !== "alert" ||
    data.can_walk === false;

  if (!hasMeaningfulInput) {
    state.currentInference = null;
    el.inferenceCard.className = "inference-card empty";
    el.inferenceCard.innerHTML = "Completa el formulario o pulsa “Inferir prioridad” para ver la clasificación automática.";
    return;
  }

  const result = inferTriage(data);
  state.currentInference = result;

  el.inferenceCard.className = `inference-card ${result.color}`;
  el.inferenceCard.innerHTML = `
    <div class="priority-badge ${result.color}">${result.label}</div>
    <h3>Prioridad sugerida</h3>
    <p>El sistema recomienda este nivel de atención con base en las respuestas registradas.</p>

    <div class="score-box">
      <strong>Puntaje inferido</strong>
      <span>${result.score}/100</span>
    </div>

    <div class="reason-list">
      ${result.reasons.map((reason) => `<div class="reason-item">${escapeHTML(reason)}</div>`).join("")}
    </div>
  `;

  if (forceMessage) {
    showToast(`Prioridad inferida: ${result.label}.`, "info");
    announce(`Prioridad inferida: ${result.label}.`);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  clearErrors();

  const formData = getFormData();
  const errors = validateForm(formData);

  if (Object.keys(errors).length) {
    setErrors(errors);
    showToast("Revisa los campos marcados.", "error");
    announce("Formulario con errores.");
    return;
  }

  const inference = inferTriage(formData);

  const payload = {
    ...formData,
    triage_color: inference.color,
    triage_label: inference.label,
    inferred_score: inference.score,
    inferred_reason: inference.reasons.join(" | "),
    attention_status: "waiting"
  };

  const { data, error } = await supabase
    .from(window.TABLES.cases)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(error);
    showToast("No se pudo guardar el caso.", "error");
    announce("Error al guardar el caso.");
    return;
  }

  await logAction(data.id, "created", `Caso creado con prioridad ${inference.label}`);
  await logAction(data.id, "inference", `Inferencia automática: ${inference.label} con puntaje ${inference.score}`);

  showToast(`Caso guardado: ${inference.label}.`, "success");
  announce(`Caso guardado: ${inference.label}.`);

  resetForm();
  await loadCases();
  showView("queue");
}

function resetForm() {
  el.triageForm.reset();
  el.painLevel.value = 0;
  el.painValue.textContent = "0";
  const firstWalkOption = document.querySelector('input[name="canWalk"][value="yes"]');
  if (firstWalkOption) firstWalkOption.checked = true;
  clearErrors();
  syncSelectableStates();
  updateInference(false);
}

async function logAction(caseId, type, note) {
  const { error } = await supabase
    .from(window.TABLES.actions)
    .insert({
      case_id: caseId,
      action_type: type,
      action_note: note
    });

  if (error) {
    console.error(error);
  }
}

function renderHome() {
  const redCount = state.cases.filter((item) => item.triage_color === "red").length;
  const yellowCount = state.cases.filter((item) => item.triage_color === "yellow").length;
  const greenCount = state.cases.filter((item) => item.triage_color === "green").length;
  const waitingCount = state.cases.filter((item) => item.attention_status === "waiting").length;
  const total = Math.max(state.cases.length, 1);

  el.statRed.textContent = redCount;
  el.statYellow.textContent = yellowCount;
  el.statGreen.textContent = greenCount;
  el.statWaiting.textContent = waitingCount;

  el.lineRed.style.width = `${Math.round((redCount / total) * 100)}%`;
  el.lineYellow.style.width = `${Math.round((yellowCount / total) * 100)}%`;
  el.lineGreen.style.width = `${Math.round((greenCount / total) * 100)}%`;
  el.lineWaiting.style.width = `${Math.round((waitingCount / total) * 100)}%`;
}

function getFilteredCases() {
  return state.cases.filter((item) => {
    const matchesSearch =
      `${item.patient_name} ${item.chief_complaint}`.toLowerCase().includes(state.filters.search);

    const matchesColor =
      state.filters.color === "all" || item.triage_color === state.filters.color;

    const matchesStatus =
      state.filters.status === "all" || item.attention_status === state.filters.status;

    return matchesSearch && matchesColor && matchesStatus;
  });
}

function renderQueue() {
  const cases = getFilteredCases();

  if (!cases.length) {
    el.queueList.innerHTML = `
      <article class="queue-card" style="--accent-color:${getColorHex('green')}">
        <h3>No hay casos para mostrar</h3>
        <p>Ajusta los filtros o registra un nuevo ingreso.</p>
      </article>
    `;
    return;
  }

  el.queueList.innerHTML = cases.map((item) => {
    const colorHex = getColorHex(item.triage_color);
    const statusChip = getStatusChip(item.attention_status);

    return `
      <article class="queue-card reveal" style="--accent-color:${colorHex}">
        <div class="queue-meta">
          <span class="chip ${item.triage_color}">${escapeHTML(item.triage_label)}</span>
          <span class="chip ${statusChip.className}">${statusChip.label}</span>
          <span class="chip">${item.age} años</span>
        </div>

        <h3>${escapeHTML(item.patient_name)}</h3>
        <p>${escapeHTML(item.chief_complaint)}</p>

        <div class="queue-meta">
          <span class="chip">${item.can_walk ? "Camina" : "No camina"}</span>
          <span class="chip">${getBreathingLabel(item.breathing_level)}</span>
          <span class="chip">Dolor ${item.pain_level}/10</span>
        </div>

        <div class="card-actions">
          <button class="btn btn-ghost" type="button" data-action="detail" data-id="${item.id}">Detalle</button>
          ${renderStatusActionButton(item)}
        </div>
      </article>
    `;
  }).join("");

  observeReveal();
}

function renderStatusActionButton(item) {
  if (item.attention_status === "waiting") {
    return `<button class="btn btn-warning" type="button" data-action="start" data-id="${item.id}">Iniciar atención</button>`;
  }

  if (item.attention_status === "in_progress") {
    return `<button class="btn btn-primary" type="button" data-action="finish" data-id="${item.id}">Marcar atendido</button>`;
  }

  return `<button class="btn btn-secondary" type="button" data-action="reopen" data-id="${item.id}">Reabrir caso</button>`;
}

function getStatusChip(status) {
  if (status === "waiting") {
    return { label: "Pendiente", className: "waiting" };
  }

  if (status === "in_progress") {
    return { label: "En atención", className: "in-progress" };
  }

  return { label: "Atendido", className: "attended" };
}

function getBreathingLabel(level) {
  if (level === "severe") return "Respiración severa";
  if (level === "moderate") return "Respiración moderada";
  return "Sin dificultad respiratoria";
}

function getColorHex(color) {
  if (color === "red") return "#ef5b5b";
  if (color === "yellow") return "#f4c542";
  return "#39b86b";
}

function openCaseDetail(id) {
  const item = state.cases.find((record) => record.id === id);
  if (!item) return;

  el.detailTitle.textContent = item.patient_name;
  el.detailBody.innerHTML = `
    <div class="detail-item">
      <strong>Clasificación</strong>
      <span>${escapeHTML(item.triage_label)} · Puntaje ${item.inferred_score}/100</span>
    </div>

    <div class="detail-item">
      <strong>Motivo principal</strong>
      <span>${escapeHTML(item.chief_complaint)}</span>
    </div>

    <div class="detail-item">
      <strong>Variables del triaje</strong>
      <span>${item.can_walk ? "Camina" : "No camina"} · ${getBreathingLabel(item.breathing_level)} · ${item.mental_state} · Dolor ${item.pain_level}/10</span>
    </div>

    <div class="detail-item">
      <strong>Señales adicionales</strong>
      <span>${item.severe_bleeding ? "Sangrado severo · " : ""}${item.chest_pain ? "Dolor torácico · " : ""}${item.fever ? "Fiebre · " : ""}${item.trauma ? "Trauma" : "Sin alarmas adicionales registradas"}</span>
    </div>

    <div class="detail-item">
      <strong>Razones inferidas</strong>
      <span>${escapeHTML(item.inferred_reason)}</span>
    </div>

    <div class="detail-item">
      <strong>Estado de atención</strong>
      <span>${getStatusChip(item.attention_status).label}</span>
    </div>

    <div class="detail-item">
      <strong>Observaciones</strong>
      <span>${escapeHTML(item.notes || "Sin observaciones")}</span>
    </div>
  `;

  el.detailDialog.showModal();
}

async function changeCaseStatus(id, nextStatus) {
  const { error } = await supabase
    .from(window.TABLES.cases)
    .update({ attention_status: nextStatus })
    .eq("id", id);

  if (error) {
    console.error(error);
    showToast("No se pudo actualizar el estado.", "error");
    return;
  }

  const statusLabel =
    nextStatus === "in_progress"
      ? "En atención"
      : nextStatus === "attended"
      ? "Atendido"
      : "Pendiente";

  await logAction(id, "status_change", `Estado actualizado a ${statusLabel}`);
  showToast(`Estado actualizado: ${statusLabel}.`, "success");
  announce(`Estado actualizado: ${statusLabel}.`);
  await loadCases();
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  el.toastRegion.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2800);
}

function announce(message) {
  el.srStatus.textContent = "";
  setTimeout(() => {
    el.srStatus.textContent = message;
  }, 30);
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function observeReveal() {
  const nodes = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  }, { threshold: 0.12 });

  nodes.forEach((node) => observer.observe(node));
}
