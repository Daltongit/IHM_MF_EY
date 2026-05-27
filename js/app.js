const { createClient } = window.supabase;
const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const state = {
  view: "home",
  theme: document.documentElement.getAttribute("data-theme") || "dark",
  spaces: [],
  reservations: [],
  suggestion: null,
  selectedSpaceId: "",
  filters: {
    search: "",
    vibe: "all",
    capacity: "all"
  }
};

const el = {
  navPills: document.querySelectorAll(".command-pill"),
  navButtons: document.querySelectorAll(".nav-button"),
  views: {
    home: document.getElementById("view-home"),
    spaces: document.getElementById("view-spaces"),
    reserve: document.getElementById("view-reserve"),
    bookings: document.getElementById("view-bookings")
  },
  themeToggle: document.getElementById("themeToggle"),
  homeSpotlight: document.getElementById("homeSpotlight"),
  metricSpaces: document.getElementById("metricSpaces"),
  metricBookings: document.getElementById("metricBookings"),
  metricAvailability: document.getElementById("metricAvailability"),
  metricSpacesBar: document.getElementById("metricSpacesBar"),
  metricBookingsBar: document.getElementById("metricBookingsBar"),
  metricAvailabilityBar: document.getElementById("metricAvailabilityBar"),
  spaceSearch: document.getElementById("spaceSearch"),
  vibeFilter: document.getElementById("vibeFilter"),
  capacityFilter: document.getElementById("capacityFilter"),
  spacesGrid: document.getElementById("spacesGrid"),
  reservationForm: document.getElementById("reservationForm"),
  reserverName: document.getElementById("reserverName"),
  purpose: document.getElementById("purpose"),
  attendees: document.getElementById("attendees"),
  experienceMode: document.getElementById("experienceMode"),
  bookingDate: document.getElementById("bookingDate"),
  startTime: document.getElementById("startTime"),
  endTime: document.getElementById("endTime"),
  spaceSelect: document.getElementById("spaceSelect"),
  needsScreen: document.getElementById("needsScreen"),
  needsVideo: document.getElementById("needsVideo"),
  note: document.getElementById("note"),
  suggestionCard: document.getElementById("suggestionCard"),
  resetReservationForm: document.getElementById("resetReservationForm"),
  bookingsList: document.getElementById("bookingsList"),
  spaceDialog: document.getElementById("spaceDialog"),
  dialogTitle: document.getElementById("dialogTitle"),
  dialogBody: document.getElementById("dialogBody"),
  closeDialogBtn: document.getElementById("closeDialogBtn"),
  toastRegion: document.getElementById("toastRegion"),
  srStatus: document.getElementById("srStatus")
};

const errorIds = [
  "reserverName",
  "purpose",
  "attendees",
  "bookingDate",
  "startTime",
  "endTime",
  "spaceSelect"
];

init();

async function init() {
  bindEvents();
  setDefaultDate();
  applyTheme(state.theme);
  observeReveal();
  await loadData();
}

function bindEvents() {
  el.navPills.forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  el.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  el.themeToggle.addEventListener("click", toggleTheme);

  el.spaceSearch.addEventListener("input", (e) => {
    state.filters.search = e.target.value.trim().toLowerCase();
    renderSpaces();
  });

  el.vibeFilter.addEventListener("change", (e) => {
    state.filters.vibe = e.target.value;
    renderSpaces();
  });

  el.capacityFilter.addEventListener("change", (e) => {
    state.filters.capacity = e.target.value;
    renderSpaces();
  });

  [
    el.reserverName,
    el.purpose,
    el.attendees,
    el.experienceMode,
    el.bookingDate,
    el.startTime,
    el.endTime,
    el.spaceSelect,
    el.needsScreen,
    el.needsVideo,
    el.note
  ].forEach((input) => {
    input.addEventListener("input", updateSuggestion);
    input.addEventListener("change", updateSuggestion);
  });

  el.reservationForm.addEventListener("submit", handleReservationSubmit);

  el.resetReservationForm.addEventListener("click", () => {
    el.reservationForm.reset();
    setDefaultDate();
    state.selectedSpaceId = "";
    clearErrors();
    populateSpaceSelect();
    updateSuggestion();
  });

  el.closeDialogBtn.addEventListener("click", () => el.spaceDialog.close());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.spaceDialog.open) {
      el.spaceDialog.close();
    }
  });
}

async function loadData() {
  const [spacesResponse, reservationsResponse] = await Promise.all([
    supabase.from(window.TABLES.spaces).select("*").order("name", { ascending: true }),
    supabase.from(window.TABLES.reservations).select("*").order("booking_date", { ascending: true })
  ]);

  if (spacesResponse.error || reservationsResponse.error) {
    console.error(spacesResponse.error || reservationsResponse.error);
    showToast("Error al cargar datos desde Supabase.", "error");
    announce("Error al cargar datos.");
    return;
  }

  state.spaces = spacesResponse.data || [];
  state.reservations = reservationsResponse.data || [];

  populateSpaceSelect();
  renderAll();
  updateSuggestion();
  showToast("Datos sincronizados.", "info");
}

function renderAll() {
  renderHome();
  renderSpaces();
  renderBookings();
}

function renderHome() {
  const activeSpaces = state.spaces.filter((space) => space.status === "active");
  const upcomingBookings = state.reservations.filter((reservation) => reservation.status === "confirmed");
  const availability = activeSpaces.length
    ? Math.round(((activeSpaces.length - busySpacesCountForNextDay()) / activeSpaces.length) * 100)
    : 0;

  el.metricSpaces.textContent = activeSpaces.length;
  el.metricBookings.textContent = upcomingBookings.length;
  el.metricAvailability.textContent = `${availability}%`;

  el.metricSpacesBar.style.width = `${Math.min(activeSpaces.length * 14, 100)}%`;
  el.metricBookingsBar.style.width = `${Math.min(upcomingBookings.length * 14, 100)}%`;
  el.metricAvailabilityBar.style.width = `${availability}%`;

  const spotlight = [...activeSpaces]
    .sort((a, b) => b.quiet_level - a.quiet_level)
    .slice(0, 3);

  el.homeSpotlight.innerHTML = spotlight.map((space) => `
    <article class="ribbon-card" style="--ribbon-accent:${space.accent_color}">
      <strong>${escapeHTML(space.name)}</strong>
      <span>${escapeHTML(space.zone)} · ${space.capacity} personas · ${escapeHTML(space.vibe)}</span>
    </article>
  `).join("");
}

function busySpacesCountForNextDay() {
  const targetDate = addDaysISO(1);
  const busyIds = new Set(
    state.reservations
      .filter((reservation) => reservation.status === "confirmed" && reservation.booking_date === targetDate)
      .map((reservation) => reservation.space_id)
  );
  return busyIds.size;
}

function getFilteredSpaces() {
  return state.spaces.filter((space) => {
    const matchesSearch =
      `${space.name} ${space.zone} ${space.description}`.toLowerCase().includes(state.filters.search);

    const matchesVibe =
      state.filters.vibe === "all" || space.vibe === state.filters.vibe;

    const matchesCapacity =
      state.filters.capacity === "all" || space.capacity <= Number(state.filters.capacity);

    return matchesSearch && matchesVibe && matchesCapacity;
  });
}

function renderSpaces() {
  const filtered = getFilteredSpaces();

  if (!filtered.length) {
    el.spacesGrid.innerHTML = `
      <article class="space-card">
        <h3>No se encontraron espacios</h3>
        <p>Ajusta los filtros o limpia la búsqueda.</p>
      </article>
    `;
    return;
  }

  el.spacesGrid.innerHTML = filtered.map((space) => {
    const currentStatus = computeDisplayAvailability(space.id);
    return `
      <article class="space-card reveal" style="--accent-glow:${space.accent_color}">
        <div class="space-card__head">
          <div>
            <h3>${escapeHTML(space.name)}</h3>
            <span class="space-status ${currentStatus.className}">${currentStatus.label}</span>
          </div>
        </div>

        <div class="space-meta">
          <span class="meta-chip">${escapeHTML(space.zone)}</span>
          <span class="meta-chip">${space.capacity} personas</span>
          <span class="meta-chip">${escapeHTML(space.vibe)}</span>
          <span class="meta-chip">Quiet ${space.quiet_level}/5</span>
        </div>

        <p>${escapeHTML(space.description)}</p>

        <div class="space-meta">
          <span class="meta-chip">${space.has_screen ? "Pantalla" : "Sin pantalla"}</span>
          <span class="meta-chip">${space.has_video ? "Video" : "Sin video"}</span>
          <span class="meta-chip">${space.status === "active" ? "Operativo" : "Mantenimiento"}</span>
        </div>

        <div class="card-actions">
          <button class="primary-btn" type="button" data-action="reserve-space" data-id="${space.id}">Reservar</button>
          <button class="soft-btn" type="button" data-action="show-space" data-id="${space.id}">Detalle</button>
        </div>
      </article>
    `;
  }).join("");

  observeReveal();

  el.spacesGrid.querySelectorAll("[data-action='reserve-space']").forEach((btn) => {
    btn.addEventListener("click", () => preselectSpace(btn.dataset.id));
  });

  el.spacesGrid.querySelectorAll("[data-action='show-space']").forEach((btn) => {
    btn.addEventListener("click", () => openSpaceDialog(btn.dataset.id));
  });
}

function computeDisplayAvailability(spaceId) {
  const space = getSpaceById(spaceId);

  if (!space || space.status !== "active") {
    return { label: "Offline", className: "offline" };
  }

  const tomorrow = addDaysISO(1);
  const hasNextDayBooking = state.reservations.some((reservation) =>
    reservation.space_id === spaceId &&
    reservation.status === "confirmed" &&
    reservation.booking_date === tomorrow
  );

  if (hasNextDayBooking) {
    return { label: "Próxima ocupación", className: "busy" };
  }

  return { label: "Disponible", className: "available" };
}

function populateSpaceSelect() {
  const options = state.spaces
    .filter((space) => space.status === "active")
    .map((space) => `
      <option value="${space.id}" ${state.selectedSpaceId === space.id ? "selected" : ""}>
        ${space.name} · ${space.zone} · ${space.capacity} personas
      </option>
    `)
    .join("");

  el.spaceSelect.innerHTML = `
    <option value="">Elegir manualmente</option>
    ${options}
  `;
}

function getFormData() {
  return {
    reserver_name: el.reserverName.value.trim(),
    purpose: el.purpose.value.trim(),
    attendees: Number(el.attendees.value),
    booking_date: el.bookingDate.value,
    start_time: el.startTime.value,
    end_time: el.endTime.value,
    experience_mode: el.experienceMode.value,
    needs_screen: el.needsScreen.checked,
    needs_video: el.needsVideo.checked,
    note: el.note.value.trim(),
    space_id: el.spaceSelect.value || state.selectedSpaceId || ""
  };
}

function updateSuggestion() {
  const formData = getFormData();
  const suggestion = getSmartSuggestion(formData);
  state.suggestion = suggestion;

  if (!suggestion) {
    el.suggestionCard.className = "suggestion-card empty";
    el.suggestionCard.innerHTML = `Completa los datos para recibir una recomendación automática.`;
    return;
  }

  el.suggestionCard.className = "suggestion-card";
  el.suggestionCard.innerHTML = `
    <div class="suggestion-score">Match ${suggestion.score}/100</div>
    <h3>${escapeHTML(suggestion.space.name)}</h3>
    <p>${escapeHTML(suggestion.space.zone)} · ${suggestion.space.capacity} personas · ${escapeHTML(suggestion.space.vibe)}</p>

    <div class="space-meta">
      <span class="meta-chip">${suggestion.space.has_screen ? "Pantalla" : "Sin pantalla"}</span>
      <span class="meta-chip">${suggestion.space.has_video ? "Video" : "Sin video"}</span>
      <span class="meta-chip">Quiet ${suggestion.space.quiet_level}/5</span>
    </div>

    <div class="reason-list">
      ${suggestion.reasons.map((reason) => `<div class="reason">${escapeHTML(reason)}</div>`).join("")}
    </div>

    <div class="card-actions">
      <button class="primary-btn" type="button" id="useSuggestionBtn">Usar sugerencia</button>
      <button class="soft-btn" type="button" id="viewSuggestionBtn">Ver espacio</button>
    </div>
  `;

  document.getElementById("useSuggestionBtn").addEventListener("click", () => {
    state.selectedSpaceId = suggestion.space.id;
    populateSpaceSelect();
    el.spaceSelect.value = suggestion.space.id;
    showToast(`Espacio sugerido seleccionado: ${suggestion.space.name}`, "success");
  });

  document.getElementById("viewSuggestionBtn").addEventListener("click", () => {
    openSpaceDialog(suggestion.space.id);
  });
}

function getSmartSuggestion(formData) {
  if (!formData.attendees || !formData.booking_date || !formData.start_time || !formData.end_time) {
    return null;
  }

  if (formData.start_time >= formData.end_time) {
    return null;
  }

  const candidates = state.spaces
    .filter((space) => space.status === "active")
    .filter((space) => isSpaceAvailable(space.id, formData.booking_date, formData.start_time, formData.end_time));

  if (!candidates.length) {
    return null;
  }

  const ranked = candidates.map((space) => {
    let score = 0;
    const reasons = [];

    if (space.capacity >= formData.attendees) {
      const spare = space.capacity - formData.attendees;
      score += Math.max(15, 40 - spare * 4);
      reasons.push(`Capacidad adecuada para ${formData.attendees} persona(s).`);
    } else {
      score -= 100;
    }

    if (space.vibe === formData.experience_mode) {
      score += 25;
      reasons.push(`Coincide con el modo ${formData.experience_mode}.`);
    }

    if (formData.needs_screen) {
      if (space.has_screen) {
        score += 15;
        reasons.push(`Tiene pantalla disponible.`);
      } else {
        score -= 60;
      }
    }

    if (formData.needs_video) {
      if (space.has_video) {
        score += 15;
        reasons.push(`Tiene soporte de video.`);
      } else {
        score -= 60;
      }
    }

    if (formData.experience_mode === "Focus") {
      score += space.quiet_level * 5;
      reasons.push(`Nivel de silencio ${space.quiet_level}/5.`);
    }

    if (formData.experience_mode === "Presentation" && space.has_screen) {
      score += 10;
    }

    if (formData.experience_mode === "Workshop" && space.capacity >= formData.attendees + 2) {
      score += 8;
    }

    return { space, score: Math.max(0, Math.min(100, score)), reasons };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked[0];
}

function isSpaceAvailable(spaceId, date, start, end, ignoreReservationId = null) {
  return !state.reservations.some((reservation) => {
    if (reservation.id === ignoreReservationId) return false;
    if (reservation.space_id !== spaceId) return false;
    if (reservation.status !== "confirmed") return false;
    if (reservation.booking_date !== date) return false;
    return start < reservation.end_time && end > reservation.start_time;
  });
}

function preselectSpace(spaceId) {
  state.selectedSpaceId = spaceId;
  populateSpaceSelect();
  el.spaceSelect.value = spaceId;
  showView("reserve");
  updateSuggestion();
  showToast("Espacio precargado para reservar.", "info");
}

function openSpaceDialog(spaceId) {
  const space = getSpaceById(spaceId);
  if (!space) return;

  const availability = computeDisplayAvailability(space.id);

  el.dialogTitle.textContent = space.name;
  el.dialogBody.innerHTML = `
    <div class="dialog-row">
      <strong>Zona</strong>
      <span>${escapeHTML(space.zone)}</span>
    </div>
    <div class="dialog-row">
      <strong>Descripción</strong>
      <span>${escapeHTML(space.description)}</span>
    </div>
    <div class="dialog-row">
      <strong>Capacidad y modo</strong>
      <span>${space.capacity} personas · ${escapeHTML(space.vibe)}</span>
    </div>
    <div class="dialog-row">
      <strong>Disponibilidad</strong>
      <span>${availability.label}</span>
    </div>
    <div class="dialog-row">
      <strong>Recursos</strong>
      <span>${space.has_screen ? "Pantalla" : "Sin pantalla"} · ${space.has_video ? "Video" : "Sin video"} · Quiet ${space.quiet_level}/5</span>
    </div>
    <div class="card-actions">
      <button class="primary-btn" type="button" id="dialogReserveBtn">Reservar este espacio</button>
    </div>
  `;

  el.spaceDialog.showModal();

  document.getElementById("dialogReserveBtn").addEventListener("click", () => {
    el.spaceDialog.close();
    preselectSpace(spaceId);
  });
}

async function handleReservationSubmit(event) {
  event.preventDefault();
  clearErrors();

  const formData = getFormData();
  let chosenSpaceId = formData.space_id;

  if (!chosenSpaceId && state.suggestion) {
    chosenSpaceId = state.suggestion.space.id;
  }

  const errors = validateForm(formData, chosenSpaceId);
  if (Object.keys(errors).length) {
    setErrors(errors);
    showToast("Revisa los campos marcados.", "error");
    announce("Formulario con errores.");
    return;
  }

  const chosenSpace = getSpaceById(chosenSpaceId);

  if (!chosenSpace) {
    setErrors({ spaceSelect: "Selecciona un espacio válido." });
    return;
  }

  if (formData.attendees > chosenSpace.capacity) {
    setErrors({ spaceSelect: `Este espacio solo admite ${chosenSpace.capacity} persona(s).` });
    showToast("Capacidad insuficiente para ese espacio.", "error");
    return;
  }

  if (!isSpaceAvailable(chosenSpaceId, formData.booking_date, formData.start_time, formData.end_time)) {
    setErrors({ spaceSelect: "Ese espacio ya está ocupado en ese horario." });
    showToast("Horario no disponible para ese espacio.", "error");
    return;
  }

  const payload = {
    space_id: chosenSpaceId,
    reserver_name: formData.reserver_name,
    purpose: formData.purpose,
    attendees: formData.attendees,
    booking_date: formData.booking_date,
    start_time: formData.start_time,
    end_time: formData.end_time,
    experience_mode: formData.experience_mode,
    needs_screen: formData.needs_screen,
    needs_video: formData.needs_video,
    note: formData.note,
    status: "confirmed"
  };

  const { error } = await supabase.from(window.TABLES.reservations).insert(payload);

  if (error) {
    console.error(error);
    showToast("No se pudo registrar la reserva.", "error");
    announce("Error al registrar la reserva.");
    return;
  }

  showToast(`Reserva confirmada en ${chosenSpace.name}.`, "success");
  announce(`Reserva confirmada en ${chosenSpace.name}.`);

  el.reservationForm.reset();
  setDefaultDate();
  state.selectedSpaceId = "";
  populateSpaceSelect();
  await loadData();
  showView("bookings");
}

function validateForm(formData, chosenSpaceId) {
  const errors = {};

  if (formData.reserver_name.length < 3) {
    errors.reserverName = "Ingresa un nombre válido.";
  }

  if (formData.purpose.length < 4) {
    errors.purpose = "El propósito debe tener al menos 4 caracteres.";
  }

  if (!formData.attendees || formData.attendees < 1) {
    errors.attendees = "Indica el número de asistentes.";
  }

  if (!formData.booking_date) {
    errors.bookingDate = "Selecciona una fecha.";
  }

  if (!formData.start_time) {
    errors.startTime = "Selecciona la hora de inicio.";
  }

  if (!formData.end_time) {
    errors.endTime = "Selecciona la hora de fin.";
  }

  if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
    errors.endTime = "La hora final debe ser posterior.";
  }

  if (!chosenSpaceId && !state.suggestion) {
    errors.spaceSelect = "Selecciona un espacio o usa la sugerencia.";
  }

  return errors;
}

function setErrors(errors) {
  Object.entries(errors).forEach(([key, value]) => {
    const node = document.getElementById(`error-${key}`);
    if (node) node.textContent = value;
  });
}

function clearErrors() {
  errorIds.forEach((id) => {
    const node = document.getElementById(`error-${id}`);
    if (node) node.textContent = "";
  });
}

function renderBookings() {
  const reservations = [...state.reservations].sort((a, b) => {
    const dateA = `${a.booking_date}T${a.start_time}`;
    const dateB = `${b.booking_date}T${b.start_time}`;
    return new Date(dateA) - new Date(dateB);
  });

  if (!reservations.length) {
    el.bookingsList.innerHTML = `
      <article class="booking-card">
        <h3>No hay reservas todavía</h3>
        <p>Crea la primera reserva desde la vista Reservar.</p>
      </article>
    `;
    return;
  }

  el.bookingsList.innerHTML = reservations.map((reservation) => {
    const space = getSpaceById(reservation.space_id);
    return `
      <article class="booking-card reveal">
        <span class="booking-status ${reservation.status}">${reservation.status === "confirmed" ? "Confirmada" : "Cancelada"}</span>
        <h3>${escapeHTML(space?.name || "Espacio")}</h3>

        <div class="booking-meta">
          <span class="meta-chip">${escapeHTML(reservation.reserver_name)}</span>
          <span class="meta-chip">${escapeHTML(reservation.experience_mode)}</span>
          <span class="meta-chip">${reservation.attendees} asistentes</span>
        </div>

        <p>${escapeHTML(reservation.purpose)}</p>

        <div class="booking-meta">
          <span class="meta-chip">${formatDate(reservation.booking_date)}</span>
          <span class="meta-chip">${reservation.start_time} - ${reservation.end_time}</span>
          <span class="meta-chip">${space?.zone || "Zona"}</span>
        </div>

        <div class="card-actions">
          <button class="soft-btn" type="button" data-action="booking-detail" data-id="${reservation.id}">Ver detalle</button>
          ${reservation.status === "confirmed" ? `<button class="cancel-btn" type="button" data-action="cancel-booking" data-id="${reservation.id}">Cancelar</button>` : ""}
        </div>
      </article>
    `;
  }).join("");

  observeReveal();

  el.bookingsList.querySelectorAll("[data-action='booking-detail']").forEach((btn) => {
    btn.addEventListener("click", () => openBookingDetail(btn.dataset.id));
  });

  el.bookingsList.querySelectorAll("[data-action='cancel-booking']").forEach((btn) => {
    btn.addEventListener("click", () => cancelBooking(btn.dataset.id));
  });
}

function openBookingDetail(bookingId) {
  const reservation = state.reservations.find((item) => item.id === bookingId);
  if (!reservation) return;

  const space = getSpaceById(reservation.space_id);

  el.dialogTitle.textContent = `Reserva · ${space?.name || "Espacio"}`;
  el.dialogBody.innerHTML = `
    <div class="dialog-row">
      <strong>Reservante</strong>
      <span>${escapeHTML(reservation.reserver_name)}</span>
    </div>
    <div class="dialog-row">
      <strong>Propósito</strong>
      <span>${escapeHTML(reservation.purpose)}</span>
    </div>
    <div class="dialog-row">
      <strong>Fecha y hora</strong>
      <span>${formatDate(reservation.booking_date)} · ${reservation.start_time} - ${reservation.end_time}</span>
    </div>
    <div class="dialog-row">
      <strong>Modo y capacidad</strong>
      <span>${escapeHTML(reservation.experience_mode)} · ${reservation.attendees} asistentes</span>
    </div>
    <div class="dialog-row">
      <strong>Notas</strong>
      <span>${escapeHTML(reservation.note || "Sin nota")}</span>
    </div>
  `;

  el.spaceDialog.showModal();
}

async function cancelBooking(bookingId) {
  const confirmCancel = window.confirm("¿Deseas cancelar esta reserva?");
  if (!confirmCancel) return;

  const { error } = await supabase
    .from(window.TABLES.reservations)
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (error) {
    console.error(error);
    showToast("No se pudo cancelar la reserva.", "error");
    return;
  }

  showToast("Reserva cancelada.", "success");
  announce("Reserva cancelada.");
  await loadData();
}

function getSpaceById(spaceId) {
  return state.spaces.find((space) => space.id === spaceId);
}

function showView(view) {
  state.view = view;

  Object.entries(el.views).forEach(([key, section]) => {
    const active = key === view;
    section.hidden = !active;
    section.classList.toggle("is-active", active);
  });

  el.navPills.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });

  announce(`Vista activa: ${view}`);
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme(state.theme);
  showToast(`Tema ${state.theme === "dark" ? "oscuro" : "claro"} activado.`, "info");
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function setDefaultDate() {
  el.bookingDate.value = addDaysISO(1);
}

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateString}T00:00:00`));
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
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
  }, 20);
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function observeReveal() {
  const revealElements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => observer.observe(element));
}
