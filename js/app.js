<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Command Center UI</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="./css/style.css" />
  <script defer src="./js/app.js"></script>
</head>
<body>
  <a class="skip-link" href="#mainContent">Saltar al contenido</a>

  <div class="app-bg"></div>
  <div class="app-noise"></div>

  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <rect x="8" y="8" width="48" height="48" rx="16" fill="none" stroke="currentColor" stroke-width="3"></rect>
            <path d="M20 38h8l4 6 12-18" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </div>

        <div>
          <p class="eyebrow">Prototipo interactivo</p>
          <h1>Command Center</h1>
        </div>
      </div>

      <div class="topbar-actions">
        <button id="themeToggle" class="btn btn-ghost" type="button">Tema</button>
      </div>
    </header>

    <main id="mainContent" class="main-layout">
      <section class="hero-panel panel">
        <div class="hero-copy">
          <p class="eyebrow">Sistema de gestión visual</p>
          <h2>Una interfaz moderna, clara y con animaciones de verdad.</h2>
          <p>
            Esta propuesta reemplaza el menú común por módulos expansibles que muestran funciones al pasar el cursor o hacer click, manteniendo la navegación intuitiva y una presentación más profesional.
          </p>

          <div class="hero-actions">
            <button class="btn btn-primary nav-trigger" type="button" data-view="home">Explorar inicio</button>
            <button class="btn btn-secondary nav-trigger" type="button" data-view="tasks">Ver tareas</button>
          </div>
        </div>

        <div class="hero-side">
          <div class="hero-metric">
            <span>Total</span>
            <strong>12</strong>
          </div>
          <div class="hero-metric">
            <span>Activas</span>
            <strong>05</strong>
          </div>
          <div class="hero-metric">
            <span>Focus</span>
            <strong>89%</strong>
          </div>
        </div>
      </section>

      <section class="module-strip">
        <button class="module-card is-active nav-trigger" type="button" data-view="home">
          <span class="module-card__head">
            <span class="module-icon">
              <svg viewBox="0 0 24 24">
                <path d="M4 12.5 12 5l8 7.5v6.5H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
                <path d="M9.5 19v-4.5h5V19" fill="none" stroke="currentColor" stroke-width="1.8"></path>
              </svg>
            </span>
            <span class="module-title">Inicio</span>
          </span>
          <span class="module-card__body">
            Panel de arranque con resumen rápido y flujo principal del prototipo.
          </span>
          <span class="module-card__expand">
            <strong>Funciones</strong>
            <small>Resumen, indicadores, accesos rápidos.</small>
          </span>
        </button>

        <button class="module-card nav-trigger" type="button" data-view="tasks">
          <span class="module-card__head">
            <span class="module-icon">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="6.5" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
                <rect x="13.5" y="4" width="6.5" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
                <rect x="13.5" y="13" width="6.5" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
              </svg>
            </span>
            <span class="module-title">Tareas</span>
          </span>
          <span class="module-card__body">
            Vista principal de navegación y lectura del sistema.
          </span>
          <span class="module-card__expand">
            <strong>Funciones</strong>
            <small>Buscar, filtrar, cambiar estado, consultar detalle.</small>
          </span>
        </button>

        <button class="module-card nav-trigger" type="button" data-view="create">
          <span class="module-card__head">
            <span class="module-icon">
              <svg viewBox="0 0 24 24">
                <path d="M5 18.5 17.5 6a2.1 2.1 0 1 1 3 3L8 21.5H5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
                <path d="M14.5 9 19 13.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
              </svg>
            </span>
            <span class="module-title">Nueva tarea</span>
          </span>
          <span class="module-card__body">
            Formulario para ingresar información con validación y feedback visual.
          </span>
          <span class="module-card__expand">
            <strong>Funciones</strong>
            <small>Formulario, validación, confirmación y limpieza.</small>
          </span>
        </button>
      </section>

      <section class="view-stage">
        <article class="view-panel panel is-active" id="view-home">
          <div class="panel-head">
            <div>
              <p class="eyebrow">Pantalla 1</p>
              <h3>Centro de operaciones</h3>
            </div>
          </div>

          <div class="stats-grid">
            <article class="stat-card">
              <span class="stat-label">Tareas del día</span>
              <strong class="stat-value">08</strong>
              <span class="stat-line"><i style="width: 82%"></i></span>
            </article>

            <article class="stat-card">
              <span class="stat-label">Prioridad alta</span>
              <strong class="stat-value">03</strong>
              <span class="stat-line"><i style="width: 61%"></i></span>
            </article>

            <article class="stat-card">
              <span class="stat-label">Interacción fluida</span>
              <strong class="stat-value">96%</strong>
              <span class="stat-line"><i style="width: 96%"></i></span>
            </article>
          </div>

          <div class="insight-grid">
            <article class="insight-card">
              <h4>Usabilidad</h4>
              <p>Las acciones principales están visibles desde el primer vistazo y el flujo se mantiene simple.</p>
            </article>
            <article class="insight-card">
              <h4>Accesibilidad</h4>
              <p>Contraste alto, etiquetas claras, foco visible y estructura semántica para mejor navegación.</p>
            </article>
            <article class="insight-card">
              <h4>Retroalimentación</h4>
              <p>El sistema responde con mensajes inmediatos, validaciones y cambios visuales de estado.</p>
            </article>
          </div>
        </article>

        <article class="view-panel panel" id="view-tasks" hidden>
          <div class="panel-head">
            <div>
              <p class="eyebrow">Pantalla 2</p>
              <h3>Flujo de tareas</h3>
            </div>

            <button class="btn btn-primary nav-trigger" type="button" data-view="create">Añadir tarea</button>
          </div>

          <div class="toolbar">
            <div class="field">
              <label for="searchTask">Buscar tarea</label>
              <input id="searchTask" type="search" placeholder="Buscar por nombre o categoría" />
            </div>

            <div class="field">
              <label for="filterTask">Estado</label>
              <select id="filterTask">
                <option>Todas</option>
                <option>Backlog</option>
                <option>Activas</option>
                <option>Completadas</option>
              </select>
            </div>
          </div>

          <div class="task-columns">
            <section class="task-column">
              <h4>Backlog</h4>
              <article class="task-item">
                <strong>Rediseño visual</strong>
                <p>Actualizar composición general del sistema.</p>
              </article>
              <article class="task-item">
                <strong>Mapa de pantallas</strong>
                <p>Definir navegación base del prototipo.</p>
              </article>
            </section>

            <section class="task-column">
              <h4>Activas</h4>
              <article class="task-item active">
                <strong>Formulario accesible</strong>
                <p>Validaciones y claridad de campos.</p>
              </article>
              <article class="task-item active">
                <strong>Feedback visual</strong>
                <p>Estados de éxito y error del sistema.</p>
              </article>
            </section>

            <section class="task-column">
              <h4>Completadas</h4>
              <article class="task-item complete">
                <strong>Investigación inicial</strong>
                <p>Base conceptual del prototipo.</p>
              </article>
            </section>
          </div>
        </article>

        <article class="view-panel panel" id="view-create" hidden>
          <div class="panel-head">
            <div>
              <p class="eyebrow">Pantalla 3</p>
              <h3>Crear nueva tarea</h3>
            </div>
          </div>

          <form id="taskForm" class="form-grid" novalidate>
            <div class="field">
              <label for="title">Título</label>
              <input id="title" type="text" placeholder="Ej. Diseñar pantalla principal" />
              <small class="error-message" id="error-title"></small>
            </div>

            <div class="field">
              <label for="category">Categoría</label>
              <input id="category" type="text" placeholder="Diseño / Frontend / UX" />
              <small class="error-message" id="error-category"></small>
            </div>

            <div class="field field-full">
              <label for="description">Descripción</label>
              <textarea id="description" rows="5" placeholder="Describe la tarea y su objetivo"></textarea>
              <small class="error-message" id="error-description"></small>
            </div>

            <div class="field">
              <label for="priority">Prioridad</label>
              <select id="priority">
                <option value="">Selecciona una prioridad</option>
                <option>Alta</option>
                <option>Media</option>
                <option>Baja</option>
              </select>
              <small class="error-message" id="error-priority"></small>
            </div>

            <div class="field">
              <label for="date">Fecha</label>
              <input id="date" type="date" />
              <small class="error-message" id="error-date"></small>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Guardar tarea</button>
              <button class="btn btn-ghost" type="reset">Limpiar</button>
            </div>
          </form>
        </article>
      </section>
    </main>
  </div>

  <div id="toastRegion" class="toast-region" aria-live="polite" aria-atomic="true"></div>
</body>
</html>
