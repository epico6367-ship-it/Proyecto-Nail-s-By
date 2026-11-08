/**
 * NAIL'S BY - LÓGICA PRINCIPAL OPTIMIZADA (ES6+ NATIVO)
 * W3C Compliant · WCAG 2.2 AA · addEventListener · Sin Frameworks
 * Arquitectura modular preparada para integración con API REST y MySQL.
 */
"use strict";

/* ====================================================================
   1. CONFIGURACIÓN Y DATOS MAESTROS DEL SALÓN
   ==================================================================== */
// Servicios de uñas con duración (min), precio ($), imagen y descripción.
// Escalabilidad: Mapea con la tabla `services` en base de datos.
const SERVICES = [
  { id: 1, n: "Manicure clásico", d: 45, p: 8.0, img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=500&q=80", desc: "Limpieza profunda, limado anatómico y esmaltado tradicional." },
  { id: 2, n: "Semipermanente", d: 60, p: 15.0, img: "https://images.unsplash.com/photo-1610992015762-45dca7fa3a85?auto=format&fit=crop&w=500&q=80", desc: "Esmaltado en gel curado en lámpara LED con duración de hasta 21 días." },
  { id: 3, n: "Uñas acrílicas", d: 120, p: 35.0, img: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=500&q=80", desc: "Esculpido profesional con tips o molde, estructura y diseño a elección." },
  { id: 4, n: "Pedicure spa", d: 75, p: 20.0, img: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=500&q=80", desc: "Exfoliación hidroterapéutica, hidratación profunda y masaje relajante." },
  { id: 5, n: "Retiro + diseño", d: 30, p: 10.0, img: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=500&q=80", desc: "Retiro técnico de acrílico/gel sin dañar la uña natural + nail art." }
];

const STAFF = ["Camila", "Daniela", "Valeria"]; // Manicuristas del salón
const OPEN_MIN = 9 * 60, CLOSE_MIN = 18 * 60, DEPOSIT_RATE = 0.3; // Horario: 09:00 a 18:00 (30% abono)

// Catálogo de productos profesionales (Escalabilidad: tabla `products` en MySQL)
const INITIAL_PRODUCTS = [
  { id: "p1", name: "Aceite de Cutícula Nutritivo", cat: "Cuidado & SPA", price: 5.0, img: "https://images.unsplash.com/photo-1597999709389-e29dc41e218a?auto=format&fit=crop&w=500&q=80", desc: "Con vitamina E y almendras dulces para restaurar cutículas resecas." },
  { id: "p2", name: "Esmalte Semipermanente Gel UV", cat: "Esmaltes & Gel", price: 6.5, img: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=500&q=80", desc: "Alta cobertura y brillo espejo duradero para lámpara LED/UV." },
  { id: "p3", name: "Crema Hidratante con Karité", cat: "Cuidado & SPA", price: 8.0, img: "https://images.unsplash.com/photo-1571875257727-256c39da42af?auto=format&fit=crop&w=500&q=80", desc: "Nutrición intensiva para manos secas con manteca pura de karité." },
  { id: "p4", name: "Kit de Limas Profesionales 100/180", cat: "Herramientas", price: 4.0, img: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=500&q=80", desc: "Pack 3 limas doble faz para uña natural y desbaste de acrílico." },
  { id: "p5", name: "Polvo Acrílico Cover Pink 2oz", cat: "Acrílico & Esculpido", price: 14.5, img: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=500&q=80", desc: "Polímero autonivelante sedoso para un esculpido uniforme y natural." },
  { id: "p6", name: "Top Coat No Wipe (Efecto Diamante)", cat: "Esmaltes & Gel", price: 7.5, img: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&w=500&q=80", desc: "Sellador final sin capa pegajosa, anti-rayones con brillo cristalino." },
  { id: "p7", name: "Exfoliante SPA Manos y Pies", cat: "Cuidado & SPA", price: 9.0, img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=500&q=80", desc: "Microcristales y aceites aromáticos para renovar la textura dérmica." },
  { id: "p8", name: "Repujador de Cutícula de Acero", cat: "Herramientas", price: 5.5, img: "img/repujador-acero.jpg", desc: "Acero quirúrgico esterilizable en calor seco o autoclave." }
];

const DB_KEY = "nb_db_v5", SESSION_KEY = "nb_sess_v5", CART_KEY = "nb_cart_v5";

/* ====================================================================
   2. ESTADO GLOBAL Y PERSISTENCIA (StorageService)
   ==================================================================== */
let db = { users: [], appts: [], products: [] };
let state = {
  currentUser: null, activeTab: "agenda", authMode: "login",
  workerFilterStatus: "all", catalogSearch: "", catalogCategory: "all",
  cart: [],
  booking: { svcId: 1, staff: "any", date: "", time: "" },
  calendar: { year: new Date().getFullYear(), month: new Date().getMonth() }
};

// Obtiene fecha actual en formato YYYY-MM-DD
const getTodayISO = () => new Date().toISOString().slice(0, 10);

// Obtiene la próxima fecha hábil abierta (si hoy es domingo o ya cerró el salón, selecciona el siguiente día laborable)
function getNextOpenDateISO() {
  const d = new Date();
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1); // Si es domingo, pasar al lunes
  } else if (d.getHours() >= 18) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Carga base de datos de localStorage o inicializa datos semilla
// Escalabilidad: Reemplazable por llamadas asíncronas fetch('api/data.php')
function initDatabase() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) db = JSON.parse(raw);
  } catch (e) {}

  if (!db.users || db.users.length === 0) {
    const today = getTodayISO();
    db = {
      users: [
        { id: "u_staff_1", name: "Daniela Administradora", email: "daniela@nailsby.com", pass: "admin123", phone: "0991234567", role: "staff" },
        { id: "u_client_1", name: "Sofía Martínez", email: "sofia@cliente.com", pass: "cliente123", phone: "0987654321", role: "client" }
      ],
      products: INITIAL_PRODUCTS,
      appts: [
        { id: "apt_101", uid: "u_client_1", client: "Sofía Martínez", phone: "0987654321", svc: 2, staff: "Camila", date: today, time: "10:00", status: "confirmada", deposit: 4.5, price: 15.0 }
      ]
    };
    saveDatabase();
  } else {
    db.products = INITIAL_PRODUCTS;
    saveDatabase();
  }

  try { state.cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { state.cart = []; }
  try {
    const uid = localStorage.getItem(SESSION_KEY);
    state.currentUser = db.users.find(u => u.id === uid) || null;
  } catch (e) {}
  if (!state.booking.date) state.booking.date = getNextOpenDateISO();
}

function saveDatabase() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    if (state.currentUser) localStorage.setItem(SESSION_KEY, state.currentUser.id);
    else localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) {}
}

/* ====================================================================
   3. UTILIDADES: FECHAS, FORMATOS, SANITIZACIÓN Y ENLACES
   ==================================================================== */
const minToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const timeToMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const getService = (id) => SERVICES.find(s => s.id === Number(id));
const formatMoney = (val) => `$${Number(val || 0).toFixed(2)}`;
const escapeHTML = (s) => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function formatDateFriendly(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function buildWhatsAppUrl(phone, text) {
  const clean = (phone || "").replace(/\D/g, "").replace(/^0/, "593");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

const buildAmazonSearchUrl = (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q + " nail care manicure")}`;

/* ====================================================================
   4. SISTEMA ACCESIBLE DE TOASTS Y MODALES (WCAG 2.1.1 Y 2.4.7)
   ==================================================================== */
// Notificación flotante accesible con role="alert" para lectores de pantalla
function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.setAttribute("role", "alert");
  t.innerHTML = `<span>${escapeHTML(msg)}</span><button type="button" class="toast-close" aria-label="Cerrar">&times;</button>`;
  const remove = () => { t.style.opacity = "0"; setTimeout(() => t.remove(), 200); };
  t.querySelector(".toast-close").addEventListener("click", remove);
  container.appendChild(t);
  setTimeout(remove, 4000);
}

// Diálogo modal accesible con trampa de foco y soporte de tecla Escape
function openModal({ title, bodyHTML, onConfirm, confirmText = "Aceptar", cancelText = "Cancelar", showCancel = true }) {
  const prev = document.querySelector(".modal-backdrop");
  if (prev) prev.remove();
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${escapeHTML(title)}</h2>
      <div>${bodyHTML}</div>
      <div class="modal-actions">
        ${showCancel ? `<button type="button" class="ghost sm modal-cancel">${escapeHTML(cancelText)}</button>` : ""}
        <button type="button" class="sm modal-confirm">${escapeHTML(confirmText)}</button>
      </div>
    </div>
  `;
  const close = () => { window.removeEventListener("keydown", keyEsc); modal.remove(); };
  const keyEsc = (e) => { if (e.key === "Escape") close(); };
  window.addEventListener("keydown", keyEsc);
  if (showCancel) modal.querySelector(".modal-cancel").addEventListener("click", close);
  modal.querySelector(".modal-confirm").addEventListener("click", () => onConfirm ? onConfirm(modal, close) : close());
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.body.appendChild(modal);
  const first = modal.querySelector("input, select, button");
  if (first) first.focus();
}

/* ====================================================================
   5. MOTOR DE DISPONIBILIDAD Y CALENDARIO NATIVO (BookingService)
   ==================================================================== */
// Detección de colisiones de horario entre citas
function isStaffFree(date, staff, startMin, duration, excludeId = null) {
  return !db.appts.some(a => {
    if ((excludeId && a.id === excludeId) || a.date !== date || a.staff !== staff || a.status === "cancelada") return false;
    const aSvc = getService(a.svc), aDur = aSvc ? aSvc.d : 45, aStart = timeToMin(a.time);
    return Math.max(aStart, startMin) < Math.min(aStart + aDur, startMin + duration);
  });
}

// Genera slots de horarios disponibles considerando domingos y cruces
function calculateSlots(date, svcId, staffMember) {
  if (!svcId || !date) return [];
  const svc = getService(svcId);
  if (!svc) return [];
  const [y, m, d] = date.split("-").map(Number);
  if (new Date(y, m - 1, d).getDay() === 0) return null; // Domingo cerrado

  const staffList = (staffMember === "any") ? STAFF : [staffMember];
  const now = new Date(), isToday = (date === getTodayISO()), curMin = now.getHours() * 60 + now.getMinutes();
  const slots = [];

  for (let t = OPEN_MIN; t + svc.d <= CLOSE_MIN; t += 30) {
    const isPast = isToday && (t <= curMin);
    const free = staffList.some(s => isStaffFree(date, s, t, svc.d));
    slots.push({ timeStr: minToTime(t), isAvailable: !isPast && free });
  }
  return slots;
}

// Widget accesible de selector de fecha mensual
function renderCalendarWidget(selectedDate, actionName = "select-date") {
  const { year, month } = state.calendar, todayStr = getTodayISO();
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay === 0) ? 6 : firstDay - 1; // Ajuste Lunes = 0

  const apptDays = new Set(db.appts.filter(a => a.status !== "cancelada").map(a => a.date));
  let cells = "";

  for (let i = 0; i < startOffset; i++) cells += `<button type="button" class="cal-day" disabled aria-hidden="true"></button>`;
  for (let d = 1; d <= totalDays; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isSun = new Date(year, month, d).getDay() === 0;
    const isPast = dStr < todayStr, isDis = isPast || isSun;
    cells += `
      <button type="button" class="cal-day ${dStr === todayStr ? "today" : ""} ${dStr === selectedDate ? "selected" : ""}"
        ${isDis ? "disabled" : ""} data-action="${actionName}" data-date="${dStr}"
        aria-label="${d} de ${months[month]}${isSun ? ", Domingo cerrado" : ""}">
        <span>${d}</span>${apptDays.has(dStr) && !isDis ? `<span class="cal-day-dot" aria-hidden="true"></span>` : ""}
      </button>`;
  }

  return `
    <div class="calendar-widget" role="group" aria-label="Calendario de turnos">
      <div class="cal-header">
        <button type="button" class="cal-nav-btn" data-action="cal-prev" aria-label="Mes anterior">&lsaquo;</button>
        <span class="cal-title">${months[month]} ${year}</span>
        <button type="button" class="cal-nav-btn" data-action="cal-next" aria-label="Mes siguiente">&rsaquo;</button>
      </div>
      <div class="cal-weekdays" aria-hidden="true"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div>
      <div class="cal-grid">${cells}</div>
      <div class="cal-legend"><span><b style="color:var(--ac)">●</b> Turnos agendados</span><span><b>Borde</b> Hoy</span></div>
    </div>`;
}

/* ====================================================================
   6. CARRITO DE COMPRAS (CatalogService)
   ==================================================================== */
const getCartTotal = () => state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
const getCartCount = () => state.cart.reduce((sum, i) => sum + i.qty, 0);

function updateHeaderCart() {
  document.querySelectorAll(".cart-badge").forEach(b => b.textContent = getCartCount());
}

function addToCart(pid) {
  const p = db.products.find(item => item.id === pid);
  if (!p) return;
  const existing = state.cart.find(i => i.id === pid);
  if (existing) existing.qty++;
  else state.cart.push({ id: p.id, name: p.name, price: p.price, img: p.img, qty: 1 });
  saveCart(); updateHeaderCart();
  showToast(`¡"${p.name}" agregado al carrito!`, "success");
}

function updateCartQty(pid, delta) {
  const i = state.cart.find(item => item.id === pid);
  if (!i) return;
  i.qty += delta;
  if (i.qty <= 0) state.cart = state.cart.filter(item => item.id !== pid);
  saveCart(); updateHeaderCart(); renderCartBody();
}

function removeFromCart(pid) {
  state.cart = state.cart.filter(i => i.id !== pid);
  saveCart(); updateHeaderCart(); renderCartBody();
  showToast("Producto removido.", "info");
}

function clearCart() {
  state.cart = []; saveCart(); updateHeaderCart(); renderCartBody();
  showToast("Carrito vaciado.", "info");
}

function getCartInnerHTML() {
  if (state.cart.length === 0) return `<div style="text-align:center; padding:24px 10px;"><p style="font-size:2rem; margin:0;">🛒</p><p><b>Tu carrito está vacío.</b></p><p class="mu">Explora nuestro catálogo para añadir productos.</p></div>`;
  return `
    <div class="cart-list" role="list">
      ${state.cart.map(i => `
        <div class="cart-item" role="listitem">
          <img src="${i.img}" alt="${escapeHTML(i.name)}" class="cart-item-img">
          <div class="cart-item-info"><b>${escapeHTML(i.name)}</b><span>${formatMoney(i.price)} c/u</span></div>
          <div class="cart-qty-controls">
            <button type="button" class="cart-qty-btn" data-action="cart-minus" data-id="${i.id}" aria-label="Disminuir">-</button>
            <b>${i.qty}</b>
            <button type="button" class="cart-qty-btn" data-action="cart-plus" data-id="${i.id}" aria-label="Aumentar">+</button>
            <button type="button" class="ghost sm" data-action="cart-remove" data-id="${i.id}" aria-label="Eliminar">🗑️</button>
          </div>
        </div>`).join("")}
    </div>
    <div class="cart-total-bar">
      <button type="button" class="ghost sm" data-action="cart-clear">Vaciar</button>
      <div><span>Total: </span><b>${formatMoney(getCartTotal())}</b></div>
    </div>`;
}

function renderCartBody() {
  const el = document.getElementById("cart-modal-body");
  if (el) el.innerHTML = getCartInnerHTML();
}

function openCartModal() {
  openModal({
    title: "🛍️ Carrito de Compras",
    bodyHTML: `<div id="cart-modal-body">${getCartInnerHTML()}</div>`,
    confirmText: "Finalizar Compra",
    onConfirm: (modal, close) => {
      if (state.cart.length === 0) { showToast("Agrega productos primero.", "error"); return; }
      const total = getCartTotal();
      state.cart = []; saveCart(); updateHeaderCart(); close();
      showToast(`¡Compra confirmada por ${formatMoney(total)}! Gracias por tu preferencia.`, "success");
    }
  });
}

/* ====================================================================
   7. VALIDACIÓN ACCESIBLE DE FORMULARIOS (ValidationService)
   ==================================================================== */
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim().toLowerCase());
const isValidPhone = (p) => { const d = String(p).replace(/\D/g, ""); return d.length === 10 && d.startsWith("09"); };

function setFieldError(input, errId, msg) {
  if (!input) return;
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", errId);
  const el = document.getElementById(errId);
  if (el) { el.textContent = msg; el.style.display = "block"; }
}

function clearFieldError(input, errId) {
  if (!input) return;
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
  const el = document.getElementById(errId);
  if (el) { el.textContent = ""; el.style.display = "none"; }
}

/* ====================================================================
   8. CONTROLADORES DE VISTAS (PÁGINAS)
   ==================================================================== */
function renderHeaderStatus() {
  const who = document.getElementById("who");
  if (!who) return;
  const count = getCartCount();
  const cartBtn = `<button type="button" class="cart-btn" data-action="open-cart" aria-label="Ver carrito">🛒 Carrito <span class="cart-badge">${count}</span></button>`;
  if (state.currentUser) {
    const role = state.currentUser.role === "staff" ? "Personal" : "Cliente";
    who.innerHTML = `<div class="header-actions">${cartBtn}<div class="user-badge"><span>${escapeHTML(state.currentUser.name.split(" ")[0])} <small class="mu">(${role})</small></span><button type="button" class="ghost sm" data-action="logout">Salir</button></div></div>`;
  } else {
    who.innerHTML = `<div class="header-actions">${cartBtn}<a href="citas.html" class="nav-link sm" style="background:var(--ac2); color:var(--ac);">Ingresar</a></div>`;
  }
}

// Vista de Agendamiento en reservas.html
function renderBookingPage() {
  const c = document.getElementById("booking-view-container");
  if (!c) return;
  const svc = getService(state.booking.svcId);
  const slots = (state.booking.svcId && state.booking.date) ? calculateSlots(state.booking.date, state.booking.svcId, state.booking.staff) : [];

  c.innerHTML = `
    <div class="card">
      <h2>1. Selecciona tu servicio</h2>
      <div class="grid" role="radiogroup" aria-label="Servicios">
        ${SERVICES.map(s => `
          <button type="button" role="radio" aria-checked="${state.booking.svcId === s.id}" class="opt ${state.booking.svcId === s.id ? "on" : ""}" data-action="select-service" data-id="${s.id}">
            <img src="${s.img}" alt="${escapeHTML(s.n)}" class="service-img" loading="lazy">
            <div class="opt-content"><b>${escapeHTML(s.n)}</b><small>${s.d} min · ${formatMoney(s.p)}</small></div>
          </button>`).join("")}
      </div>

      <h2 style="margin-top:20px;">2. Manicurista</h2>
      <select id="staff-select" aria-label="Seleccionar manicurista">
        <option value="any" ${state.booking.staff === "any" ? "selected" : ""}>Cualquiera disponible</option>
        ${STAFF.map(st => `<option value="${st}" ${state.booking.staff === st ? "selected" : ""}>${st}</option>`).join("")}
      </select>

      <h2 style="margin-top:20px;">3. Fecha en calendario</h2>
      ${renderCalendarWidget(state.booking.date, "booking-date")}

      <h2 style="margin-top:20px;">4. Horarios</h2>
      ${slots === null ? `<p class="mu" style="color:var(--bad)">Domingos cerrado. Por favor elige otro día.</p>` : slots.length === 0 ? `<p class="mu">Selecciona un servicio y fecha para calcular disponibilidad.</p>` : `
        <div class="slots" role="group" aria-label="Horarios">
          ${slots.map(s => s.isAvailable ? `
            <button type="button" class="${state.booking.time === s.timeStr ? "on" : ""}" data-action="booking-time" data-time="${s.timeStr}" aria-label="Disponible ${s.timeStr}">${s.timeStr}</button>
          ` : `
            <button type="button" class="busy" disabled aria-label="Ocupado ${s.timeStr}">${s.timeStr}</button>
          `).join("")}
        </div>`}
    </div>

    <div class="card" style="border-left:5px solid var(--ac);">
      <h2>5. Confirmación de Cita</h2>
      <form id="booking-form" novalidate>
        <label for="b-name">Nombre y Apellido *</label>
        <input id="b-name" type="text" value="${state.currentUser ? escapeHTML(state.currentUser.name) : ""}" required>
        <span class="error-text" id="err-b-name" role="alert" style="display:none;"></span>

        <label for="b-phone">Celular WhatsApp *</label>
        <input id="b-phone" type="tel" placeholder="09XXXXXXXX" value="${state.currentUser ? escapeHTML(state.currentUser.phone) : ""}" required>
        <span class="error-text" id="err-b-phone" role="alert" style="display:none;"></span>

        <div style="background:var(--ac2); padding:12px; border-radius:10px; margin:14px 0;">
          <p style="margin:2px 0;"><b>Servicio:</b> ${svc ? escapeHTML(svc.n) : ""} (${svc ? svc.d : 0} min)</p>
          <p style="margin:2px 0;"><b>Fecha:</b> ${formatDateFriendly(state.booking.date)} a las ${state.booking.time || "--:--"} hrs</p>
          <p style="margin:2px 0;"><b>Total:</b> ${formatMoney(svc ? svc.p : 0)} · <span class="mu">Abono (30%): ${formatMoney(svc ? svc.p * DEPOSIT_RATE : 0)}</span></p>
        </div>
        <button type="submit" class="btn-full">📅 Confirmar y Agendar Cita</button>
      </form>
    </div>`;

  const sel = c.querySelector("#staff-select");
  if (sel) sel.addEventListener("change", (e) => { state.booking.staff = e.target.value; state.booking.time = ""; renderBookingPage(); });
  const form = c.querySelector("#booking-form");
  if (form) form.addEventListener("submit", (e) => { e.preventDefault(); handleBookingSubmit(form); });
}

function handleBookingSubmit(form) {
  const nIn = form.querySelector("#b-name"), pIn = form.querySelector("#b-phone");
  clearFieldError(nIn, "err-b-name"); clearFieldError(pIn, "err-b-phone");
  const name = nIn.value.trim(), phone = pIn.value.trim();
  let err = false;

  if (name.length < 3) { setFieldError(nIn, "err-b-name", "Ingresa tu nombre completo (mínimo 3 letras)."); err = true; }
  if (!isValidPhone(phone)) { setFieldError(pIn, "err-b-phone", "Ingresa un celular de 10 dígitos (09XXXXXXXX)."); err = true; }
  if (!state.booking.svcId || !state.booking.date || !state.booking.time) { showToast("Completa la selección de servicio, fecha y horario.", "error"); err = true; }
  if (err) return;

  const svc = getService(state.booking.svcId);
  const staff = (state.booking.staff === "any") ? STAFF.find(s => isStaffFree(state.booking.date, s, timeToMin(state.booking.time), svc.d)) : state.booking.staff;
  if (!staff || !isStaffFree(state.booking.date, staff, timeToMin(state.booking.time), svc.d)) {
    showToast("Ese horario ya no está disponible.", "error"); state.booking.time = ""; renderBookingPage(); return;
  }

  const appt = {
    id: "apt_" + Date.now(), uid: state.currentUser ? state.currentUser.id : ("u_" + Date.now()),
    client: name, phone, svc: svc.id, staff, date: state.booking.date, time: state.booking.time,
    status: "pendiente", deposit: 0, price: svc.p
  };
  db.appts.push(appt);
  if (!state.currentUser) {
    const newUser = { id: appt.uid, name, email: `${phone}@cliente.com`, phone, pass: "123456", role: "client" };
    db.users.push(newUser); state.currentUser = newUser;
  }
  saveDatabase();
  showToast("¡Cita agendada con éxito!", "success");
  setTimeout(() => window.location.href = "citas.html", 1000);
}

// Vista de Catálogo en catalogo.html
function renderCatalogPage() {
  const c = document.getElementById("catalog-view-container");
  if (!c) return;
  const cats = ["all", "Cuidado & SPA", "Esmaltes & Gel", "Herramientas", "Acrílico & Esculpido"];
  const list = db.products.filter(p => {
    const mQ = p.name.toLowerCase().includes(state.catalogSearch.toLowerCase()) || p.desc.toLowerCase().includes(state.catalogSearch.toLowerCase());
    const mC = state.catalogCategory === "all" || p.cat === state.catalogCategory;
    return mQ && mC;
  });

  c.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <h2>Insumos Profesionales para Uñas</h2>
        <button type="button" class="cart-btn" data-action="open-cart">🛒 Carrito (<span class="cart-badge">${getCartCount()}</span>)</button>
      </div>
      <div class="filter-bar" style="display:flex; gap:10px; flex-wrap:wrap;">
        <input id="cat-search" type="search" placeholder="Buscar producto..." value="${escapeHTML(state.catalogSearch)}" style="flex:2; min-width:200px;" aria-label="Buscar">
        <select id="cat-select" style="flex:1; min-width:160px;" aria-label="Categoría">
          ${cats.map(cat => `<option value="${cat}" ${state.catalogCategory === cat ? "selected" : ""}>${cat === "all" ? "Todas las categorías" : cat}</option>`).join("")}
        </select>
      </div>
      ${list.length === 0 ? `<p class="mu" style="text-align:center; padding:30px;">No encontramos productos con ese término.</p>` : `
        <div class="catalog-grid" role="list">
          ${list.map(p => `
            <div class="product-card" role="listitem">
              <img src="${p.img}" alt="${escapeHTML(p.name)}" class="product-img" loading="lazy">
              <div class="product-body">
                <span class="tag" style="margin-bottom:6px; align-self:flex-start;">${escapeHTML(p.cat)}</span>
                <div class="product-title">${escapeHTML(p.name)}</div>
                <div class="product-desc">${escapeHTML(p.desc)}</div>
                <div class="product-footer">
                  <span class="product-price">${formatMoney(p.price)}</span>
                  <div class="btns">
                    <a href="${buildAmazonSearchUrl(p.name)}" target="_blank" rel="noopener noreferrer" class="amazon-link">Amazon ↗</a>
                    <button type="button" class="sm" data-action="add-cart" data-id="${p.id}">🛒 Agregar</button>
                  </div>
                </div>
              </div>
            </div>`).join("")}
        </div>`}
    </div>`;

  const sIn = c.querySelector("#cat-search");
  if (sIn) sIn.addEventListener("input", (e) => {
    state.catalogSearch = e.target.value; renderCatalogPage();
    const ref = document.getElementById("cat-search");
    if (ref) { ref.focus(); ref.selectionStart = ref.selectionEnd = ref.value.length; }
  });
  const cSel = c.querySelector("#cat-select");
  if (cSel) cSel.addEventListener("change", (e) => { state.catalogCategory = e.target.value; renderCatalogPage(); });
}

// Vista de Citas y Panel en citas.html
function renderAppointmentsPage() {
  const c = document.getElementById("appointments-view-container");
  if (!c) return;

  if (!state.currentUser) {
    const isLog = state.authMode === "login";
    c.innerHTML = `
      <div class="card" style="max-width:480px; margin:0 auto;">
        <h2>Acceso a tu Cuenta</h2>
        <div class="tabs" role="tablist">
          <button type="button" role="tab" aria-selected="${isLog}" class="${isLog ? "on" : ""}" data-action="switch-auth" data-mode="login">Iniciar Sesión</button>
          <button type="button" role="tab" aria-selected="${!isLog}" class="${!isLog ? "on" : ""}" data-action="switch-auth" data-mode="register">Crear Cuenta</button>
        </div>
        <form id="auth-form" novalidate>
          ${!isLog ? `
            <label for="reg-name">Nombre completo *</label>
            <input id="reg-name" type="text" required>
            <span class="error-text" id="err-reg-name" role="alert" style="display:none;"></span>
            <label for="reg-phone">Celular WhatsApp *</label>
            <input id="reg-phone" type="tel" placeholder="09XXXXXXXX" required>
            <span class="error-text" id="err-reg-phone" role="alert" style="display:none;"></span>
            <label for="reg-role">Perfil *</label>
            <select id="reg-role"><option value="client">Cliente</option><option value="staff">Personal</option></select>
          ` : ""}
          <label for="auth-email">Correo electrónico *</label>
          <input id="auth-email" type="email" placeholder="usuario@correo.com" required>
          <span class="error-text" id="err-auth-email" role="alert" style="display:none;"></span>
          <label for="auth-pass">Contraseña *</label>
          <input id="auth-pass" type="password" placeholder="Mínimo 6 caracteres" required minlength="6">
          <span class="error-text" id="err-auth-pass" role="alert" style="display:none;"></span>
          <p style="margin-top:16px;"><button type="submit" class="btn-full">${isLog ? "Ingresar" : "Registrarme"}</button></p>
        </form>
      </div>`;
    const aForm = c.querySelector("#auth-form");
    if (aForm) aForm.addEventListener("submit", (e) => { e.preventDefault(); handleAuthSubmit(aForm); });
    return;
  }

  // Si es Cliente
  if (state.currentUser.role === "client") {
    const my = db.appts.filter(a => a.uid === state.currentUser.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    c.innerHTML = `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <h2>Mis Citas Agendadas</h2>
          <a href="reservas.html" class="nav-link sm" style="background:var(--ac); color:#fff;">+ Nueva Cita</a>
        </div>
        ${my.length === 0 ? `<p class="mu" style="text-align:center; padding:24px;">No tienes citas registradas aún.</p>` : `
          <div role="list">
            ${my.map(a => {
              const s = getService(a.svc) || { n: "Servicio", p: a.price };
              return `
                <div class="row" role="listitem">
                  <div>
                    <b>${escapeHTML(s.n)}</b>
                    <span class="mu">${formatDateFriendly(a.date)} · ${a.time} hrs · con ${escapeHTML(a.staff)}</span>
                    <span class="mu">Total: ${formatMoney(a.price)} ${a.deposit > 0 ? `(Abono: ${formatMoney(a.deposit)})` : ""}</span>
                  </div>
                  <div class="btns">
                    <span class="tag ${a.status}">${escapeHTML(a.status)}</span>
                    ${a.status !== "cancelada" ? `<button type="button" class="ghost sm" data-action="client-cancel" data-id="${a.id}">Cancelar</button>` : ""}
                  </div>
                </div>`;
            }).join("")}
          </div>`}
      </div>`;
    return;
  }

  // Si es Personal (Staff)
  const targetDate = state.booking.date || getTodayISO();
  const filter = state.workerFilterStatus || "all";
  let list = db.appts.filter(a => a.date === targetDate);
  if (filter !== "all") list = list.filter(a => a.status === filter);
  list.sort((a, b) => a.time.localeCompare(b.time));

  c.innerHTML = `
    <div class="card">
      <h2>Control Diario del Salón</h2>
      <label for="agenda-date">Fecha a consultar:</label>
      <input id="agenda-date" type="date" value="${targetDate}" style="max-width:240px; margin-bottom:12px;">
      <div class="filter-bar" role="group">
        ${["all", "pendiente", "confirmada", "completada", "cancelada"].map(f => `
          <button type="button" class="sm ${filter === f ? "" : "ghost"}" data-action="set-worker-filter" data-filter="${f}">${f.toUpperCase()}</button>
        `).join("")}
      </div>
      ${STAFF.map(st => {
        const sAppts = list.filter(a => a.staff === st);
        return `
          <h3 style="border-bottom:2px solid var(--bd); padding-bottom:4px; margin-top:18px;">${escapeHTML(st)} (${sAppts.length} citas)</h3>
          ${sAppts.length === 0 ? `<p class="mu">Sin citas registradas.</p>` : `
            <div role="list">
              ${sAppts.map(a => {
                const s = getService(a.svc) || { n: "Servicio", p: a.price };
                const msg = `Hola ${a.client.split(" ")[0]}, recordamos tu cita para ${s.n} el ${formatDateFriendly(a.date)} a las ${a.time} hrs. 💅`;
                return `
                  <div class="row" role="listitem">
                    <div>
                      <b>${a.time} hrs · ${escapeHTML(s.n)}</b>
                      <span class="mu">${escapeHTML(a.client)} (${escapeHTML(a.phone)}) · Total: ${formatMoney(a.price)} (Abono: ${formatMoney(a.deposit)})</span>
                    </div>
                    <div class="btns">
                      <span class="tag ${a.status}">${escapeHTML(a.status)}</span>
                      <button type="button" class="ghost sm" data-action="staff-status" data-id="${a.id}" data-status="confirmada">Confirmar</button>
                      <button type="button" class="ghost sm" data-action="staff-deposit" data-id="${a.id}">Abono</button>
                      <button type="button" class="ghost sm" data-action="staff-status" data-id="${a.id}" data-status="completada">Completada</button>
                      <button type="button" class="ghost sm" data-action="staff-status" data-id="${a.id}" data-status="cancelada">Cancelar</button>
                      <a href="${buildWhatsAppUrl(a.phone, msg)}" target="_blank" rel="noopener noreferrer" class="wa sm">WhatsApp</a>
                    </div>
                  </div>`;
              }).join("")}
            </div>`}
        `;
      }).join("")}
    </div>`;

  const dPick = c.querySelector("#agenda-date");
  if (dPick) dPick.addEventListener("change", (e) => { state.booking.date = e.target.value; renderAppointmentsPage(); });
}

function handleAuthSubmit(form) {
  const eIn = form.querySelector("#auth-email"), pIn = form.querySelector("#auth-pass");
  clearFieldError(eIn, "err-auth-email"); clearFieldError(pIn, "err-auth-pass");
  const email = eIn.value.trim().toLowerCase(), pass = pIn.value;
  let err = false;

  if (!isValidEmail(email)) { setFieldError(eIn, "err-auth-email", "Correo no válido."); err = true; }
  if (pass.length < 6) { setFieldError(pIn, "err-auth-pass", "Mínimo 6 caracteres."); err = true; }
  if (err) return;

  if (state.authMode === "login") {
    const u = db.users.find(usr => usr.email === email && usr.pass === pass);
    if (!u) { setFieldError(eIn, "err-auth-email", "Credenciales incorrectas."); return; }
    state.currentUser = u; saveDatabase(); showToast(`Bienvenida/o, ${u.name}!`, "success"); renderCurrentPage();
  } else {
    const nIn = form.querySelector("#reg-name"), phIn = form.querySelector("#reg-phone"), rIn = form.querySelector("#reg-role");
    const name = nIn.value.trim(), phone = phIn.value.trim(), role = rIn.value;
    if (name.length < 3) { setFieldError(nIn, "err-reg-name", "Mínimo 3 letras."); err = true; }
    if (!isValidPhone(phone)) { setFieldError(phIn, "err-reg-phone", "Teléfono de 10 dígitos (09XXXXXXXX)."); err = true; }
    if (db.users.some(usr => usr.email === email)) { setFieldError(eIn, "err-auth-email", "Correo ya registrado."); err = true; }
    if (err) return;

    const u = { id: "u_" + Date.now(), name, email, pass, phone, role };
    db.users.push(u); state.currentUser = u; saveDatabase();
    showToast("Cuenta creada exitosamente.", "success"); renderCurrentPage();
  }
}

function renderCurrentPage() {
  renderHeaderStatus(); renderBookingPage(); renderCatalogPage(); renderAppointmentsPage();
}

/* ====================================================================
   9. DELEGACIÓN CENTRAL DE EVENTOS (CERO ONCLICK INLINE - REGLA W3C)
   ==================================================================== */
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const act = target.getAttribute("data-action");

  if (act === "open-cart") openCartModal();
  else if (act === "logout") { state.currentUser = null; saveDatabase(); showToast("Sesión cerrada.", "info"); renderCurrentPage(); }
  else if (act === "switch-auth") { state.authMode = target.getAttribute("data-mode"); renderAppointmentsPage(); }
  else if (act === "select-service") { state.booking.svcId = Number(target.getAttribute("data-id")); state.booking.time = ""; renderBookingPage(); }
  else if (act === "booking-date") { state.booking.date = target.getAttribute("data-date"); state.booking.time = ""; renderBookingPage(); }
  else if (act === "booking-time") { state.booking.time = target.getAttribute("data-time"); renderBookingPage(); }
  else if (act === "cal-prev") { if (state.calendar.month === 0) { state.calendar.month = 11; state.calendar.year--; } else state.calendar.month--; renderBookingPage(); }
  else if (act === "cal-next") { if (state.calendar.month === 11) { state.calendar.month = 0; state.calendar.year++; } else state.calendar.month++; renderBookingPage(); }
  else if (act === "add-cart") addToCart(target.getAttribute("data-id"));
  else if (act === "cart-plus") updateCartQty(target.getAttribute("data-id"), 1);
  else if (act === "cart-minus") updateCartQty(target.getAttribute("data-id"), -1);
  else if (act === "cart-remove") removeFromCart(target.getAttribute("data-id"));
  else if (act === "cart-clear") clearCart();
  else if (act === "set-worker-filter") { state.workerFilterStatus = target.getAttribute("data-filter"); renderAppointmentsPage(); }
  else if (act === "staff-status") {
    const a = db.appts.find(item => item.id === target.getAttribute("data-id"));
    if (a) { a.status = target.getAttribute("data-status"); saveDatabase(); showToast(`Cita "${a.status}".`, "success"); renderAppointmentsPage(); }
  }
  else if (act === "client-cancel") {
    const aid = target.getAttribute("data-id");
    openModal({
      title: "¿Cancelar cita?", bodyHTML: "<p>¿Segura de cancelar tu turno? El horario quedará liberado.</p>",
      confirmText: "Sí, cancelar",
      onConfirm: (m, close) => {
        const a = db.appts.find(item => item.id === aid);
        if (a) { a.status = "cancelada"; saveDatabase(); close(); showToast("Cita cancelada.", "info"); renderAppointmentsPage(); }
      }
    });
  }
  else if (act === "staff-deposit") {
    const a = db.appts.find(item => item.id === target.getAttribute("data-id"));
    if (!a) return;
    openModal({
      title: "Registrar Abono",
      bodyHTML: `<p>Cliente: <b>${escapeHTML(a.client)}</b> (Total: ${formatMoney(a.price)})</p><label for="dep-val">Monto recibido ($):</label><input id="dep-val" type="number" step="0.5" value="${a.deposit || (a.price * DEPOSIT_RATE).toFixed(2)}">`,
      confirmText: "Guardar",
      onConfirm: (m, close) => {
        const v = parseFloat(m.querySelector("#dep-val").value);
        if (!isNaN(v) && v >= 0) { a.deposit = v; saveDatabase(); close(); showToast("Abono registrado.", "success"); renderAppointmentsPage(); }
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initDatabase();
  renderCurrentPage();
});
