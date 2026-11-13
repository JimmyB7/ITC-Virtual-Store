import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import SUPABASE_KEYS from "../assets/Keys.js";

const supabase = createClient(SUPABASE_KEYS.url, SUPABASE_KEYS.anonKey);
const loginPanel = document.getElementById("admin-login");
const ordersPanel = document.getElementById("admin-orders");
const loginForm = document.getElementById("admin-login-form");
const loginButton = document.getElementById("admin-login-submit");
const loginMessage = document.getElementById("admin-login-message");
const adminUsername = "admin";
const adminEmail = "admin@example.com";
const ordersMessage = document.getElementById("admin-orders-message");
const ordersList = document.getElementById("admin-orders-list");
const sessionUser = document.getElementById("admin-session-user");
const refreshButton = document.getElementById("admin-refresh");
const logoutButton = document.getElementById("admin-logout");
const exportButton = document.getElementById("admin-export");
const orderSearchInput = document.getElementById("admin-order-search-input");
const clearSearchButton = document.getElementById("admin-order-search-clear");
const statusFilter = document.getElementById("admin-order-status-filter");
const dashboardView = document.getElementById("admin-dashboard");
const ordersView = document.getElementById("admin-orders-view");
const viewTitle = document.getElementById("admin-orders-title");
const filteredCount = document.getElementById("admin-filtered-count");
const orderCountBadge = document.getElementById("admin-nav-order-count");
const statusSummary = document.getElementById("admin-status-summary");
const productSummary = document.getElementById("admin-product-summary");
const navigationButtons = [...document.querySelectorAll(".admin-side-nav [data-admin-view]")];
const viewButtons = [...document.querySelectorAll("[data-admin-view]")];
let orders = [];
const statusChoices = [
  { value: "PAGO_SIMULADO", label: "Pago de prueba registrado (Bre-B)" },
  { value: "PREPARANDO", label: "Preparando en papelería" },
  { value: "LISTO_PARA_RECOGER", label: "Listo para recoger" },
  { value: "ENTREGADO", label: "Entregado" }
];
const statusLabels = {
  PAGO_SIMULADO: "Pago de prueba registrado (Bre-B)",
  VERIFICADO_NEQUI: "Pago registrado (orden anterior)",
  PREPARANDO: "Preparando en papelería",
  PREPARANDO_EN_PAPELERIA: "Preparando en papelería",
  LISTO_PARA_RECOGER: "Listo para recoger",
  LISTO_PARA_RECOGER_EN_CAMPUS_ETITC: "Listo para recoger en campus",
  ENTREGADO: "Entregado"
};
const statusGroups = [
  { key: "PAGO_SIMULADO", label: "Pago de prueba", states: ["PAGO_SIMULADO", "VERIFICADO_NEQUI"] },
  { key: "preparing", label: "En preparación", states: ["PREPARANDO", "PREPARANDO_EN_PAPELERIA"] },
  { key: "LISTO_PARA_RECOGER", label: "Listos para recoger", states: ["LISTO_PARA_RECOGER", "LISTO_PARA_RECOGER_EN_CAMPUS_ETITC"] },
  { key: "ENTREGADO", label: "Entregados", states: ["ENTREGADO"] }
];
const preparingStates = [
  "PAGO_SIMULADO",
  "VERIFICADO_NEQUI",
  "PREPARANDO",
  "PREPARANDO_EN_PAPELERIA"
];

const formatCurrency = (value) => new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
}).format(Number(value) || 0);

function showMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `admin-message${type ? ` ${type}` : ""}`;
}

function setAuthenticated(session) {
  const isAuthenticated = Boolean(session?.user);
  const wasAuthenticated = !ordersPanel.hidden;
  loginPanel.hidden = isAuthenticated;
  ordersPanel.hidden = !isAuthenticated;
  sessionUser.textContent = isAuthenticated ? session.user.email || "Sesión autenticada" : "";
  if (!isAuthenticated) {
    orders = [];
    ordersList.replaceChildren();
    orderSearchInput.value = "";
    statusFilter.value = "";
    renderDashboard();
  } else if (!wasAuthenticated) {
    setView("dashboard");
  }
}

function setView(view) {
  const showDashboard = view !== "orders";
  dashboardView.hidden = !showDashboard;
  ordersView.hidden = showDashboard;
  viewTitle.textContent = showDashboard ? "Dashboard" : "Pedidos";
  navigationButtons.forEach((button) => {
    const active = button.dataset.adminView === (showDashboard ? "dashboard" : "orders");
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (!showDashboard) renderOrders();
}

function getStatusLabel(value) {
  const group = statusGroups.find((item) => item.key === value);
  if (value === "pending") return "Por preparar";
  if (value === "other") return "Otros estados";
  if (group && !statusLabels[value]) return group.label;
  return statusLabels[value] || value || "Sin estado";
}

function createDetail(label, value) {
  const detail = document.createElement("div");
  detail.className = "admin-order-detail";
  const heading = document.createElement("span");
  heading.className = "admin-detail-label";
  heading.textContent = label;
  const content = document.createElement("span");
  content.className = "admin-detail-value";
  content.textContent = value;
  detail.append(heading, content);
  return detail;
}

function renderOrder(order) {
  const card = document.createElement("article");
  card.className = "admin-order-card";

  const heading = document.createElement("div");
  heading.className = "admin-order-heading";
  const code = document.createElement("h2");
  code.textContent = order.codigo_unico || "Orden sin código";
  const currentStatus = statusChoices.find((status) => status.value === order.estado);
  const status = document.createElement("span");
  status.className = "admin-order-status";
  status.textContent = currentStatus?.label || getStatusLabel(order.estado);
  heading.append(code, status);
  card.appendChild(heading);

  const details = document.createElement("div");
  details.className = "admin-order-details";
  details.appendChild(createDetail("Total", formatCurrency(order.total)));
  details.appendChild(createDetail("Franja", order.franja_horaria || "No especificada"));

  const buyer = order.comprador && typeof order.comprador === "object" ? order.comprador : {};
  details.appendChild(createDetail("Cliente", buyer.nombre || "No especificado"));
  details.appendChild(createDetail("Correo", buyer.correo || "No especificado"));
  if (buyer.referencia_pago) {
    details.appendChild(createDetail("Referencia de pago", String(buyer.referencia_pago)));
  }
  card.appendChild(details);

  const itemList = document.createElement("ul");
  itemList.className = "admin-order-items";
  const items = Array.isArray(order.items) ? order.items : [];
  items.forEach((item) => {
    const listItem = document.createElement("li");
    const name = typeof item.nombre === "string" ? item.nombre : "Producto";
    const quantity = Number(item.cantidad) || 0;
    const price = Number(item.precio) || 0;
    listItem.textContent = `${name} · ${quantity} × ${formatCurrency(price)}`;
    itemList.appendChild(listItem);
  });
  if (items.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No hay detalle de productos disponible.";
    itemList.appendChild(emptyItem);
  }
  card.appendChild(itemList);

  const form = document.createElement("form");
  form.className = "admin-order-update";
  const label = document.createElement("label");
  const selectId = `estado-${order.codigo_unico}`;
  label.htmlFor = selectId;
  label.textContent = "Cambiar estado";

  const select = document.createElement("select");
  select.id = selectId;
  select.name = "estado";
  if (!currentStatus) {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecciona un estado";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);
  }
  statusChoices.forEach((choice) => {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = choice.value === order.estado;
    select.appendChild(option);
  });

  const saveButton = document.createElement("button");
  saveButton.className = "btn-primary admin-save-status";
  saveButton.type = "submit";
  saveButton.textContent = "Guardar estado";

  form.append(label, select, saveButton);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    saveButton.textContent = "Guardando...";
    showMessage(ordersMessage, `Actualizando ${order.codigo_unico}…`);

    try {
      const { error } = await supabase.rpc("admin_actualizar_estado_orden", {
        p_codigo: order.codigo_unico,
        p_estado: select.value
      });
      if (error) throw error;
      showMessage(ordersMessage, `Estado de ${order.codigo_unico} actualizado.`, "success");
      await loadOrders();
    } catch (error) {
      console.error("Error al actualizar el estado de la orden:", error);
      showMessage(ordersMessage, getAdminErrorMessage(error), "error");
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Guardar estado";
    }
  });
  card.appendChild(form);
  return card;
}

function getFilteredOrders() {
  const searchTerm = orderSearchInput.value.trim().toLocaleLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedGroup = statusGroups.find((group) => group.key === selectedStatus);
  const selectedStates = selectedStatus === "pending" ? preparingStates : selectedGroup?.states;
  return orders.filter((order) => {
    const buyer = order.comprador && typeof order.comprador === "object" ? order.comprador : {};
    const searchableText = [
      order.codigo_unico,
      buyer.nombre,
      buyer.correo
    ].join(" ").toLocaleLowerCase();
    const matchesSearch = searchableText.includes(searchTerm);
    let matchesStatus = true;
    if (selectedStates) {
      matchesStatus = selectedStates.includes(order.estado);
    } else if (selectedStatus === "other") {
      matchesStatus = !statusGroups.some((group) => group.states.includes(order.estado));
    } else if (selectedStatus) {
      matchesStatus = order.estado === selectedStatus;
    }
    return matchesSearch && matchesStatus;
  });
}

function refreshStatusOptions() {
  const previousValue = statusFilter.value;
  const values = [...new Set([
    ...statusChoices.map((choice) => choice.value),
    "pending",
    ...statusGroups.map((group) => group.key),
    ...(orders.some((order) => !statusGroups.some((group) => group.states.includes(order.estado))) ? ["other"] : []),
    ...orders.map((order) => order.estado).filter(Boolean)
  ])];
  statusFilter.replaceChildren(new Option("Todos los estados", ""));
  values.forEach((value) => {
    statusFilter.add(new Option(getStatusLabel(value), value));
  });
  statusFilter.value = values.includes(previousValue) ? previousValue : "";
}

function renderOrders() {
  const searchTerm = orderSearchInput.value.trim();
  clearSearchButton.hidden = !searchTerm;
  refreshStatusOptions();
  const filteredOrders = getFilteredOrders();
  ordersList.replaceChildren();
  filteredCount.textContent = `${filteredOrders.length} ${filteredOrders.length === 1 ? "pedido" : "pedidos"}`;

  if (filteredOrders.length === 0) {
    showMessage(
      ordersMessage,
      orders.length === 0
        ? "No hay pedidos registrados todavía."
        : searchTerm || statusFilter.value
          ? "No se encontraron pedidos con esos criterios."
          : "No hay pedidos para mostrar."
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  filteredOrders.forEach((order) => fragment.appendChild(renderOrder(order)));
  ordersList.appendChild(fragment);
  const countMessage = `${filteredOrders.length} pedido${filteredOrders.length === 1 ? "" : "s"} mostrado${filteredOrders.length === 1 ? "" : "s"}.`;
  showMessage(ordersMessage, countMessage, "success");
}

function renderDashboard() {
  const countStates = (states) => orders.filter((order) => states.includes(order.estado)).length;
  const preparingCount = countStates(preparingStates);
  const readyCount = countStates(["LISTO_PARA_RECOGER", "LISTO_PARA_RECOGER_EN_CAMPUS_ETITC"]);
  const totalValue = orders.reduce((total, order) => {
    const value = Number(order.total);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);

  document.getElementById("admin-metric-total").textContent = String(orders.length);
  document.getElementById("admin-metric-preparing").textContent = String(preparingCount);
  document.getElementById("admin-metric-ready").textContent = String(readyCount);
  document.getElementById("admin-metric-value").textContent = formatCurrency(totalValue);
  orderCountBadge.textContent = String(orders.length);

  statusSummary.replaceChildren();
  const groups = statusGroups.map((group) => ({
    ...group,
    count: countStates(group.states)
  }));
  const otherCount = orders.filter((order) =>
    !statusGroups.some((group) => group.states.includes(order.estado))
  ).length;
  if (otherCount) groups.push({ key: "other", label: "Otros estados", states: [], count: otherCount });
  const maxCount = Math.max(1, ...groups.map((group) => group.count));

  groups.forEach((group) => {
    const row = document.createElement("button");
    row.className = "admin-status-row";
    row.type = "button";
    row.dataset.adminFilter = group.key;
    row.setAttribute("aria-label", `Filtrar ${group.label}: ${group.count} pedidos`);

    const label = document.createElement("span");
    label.className = "admin-status-name";
    label.textContent = group.label;
    const count = document.createElement("strong");
    count.textContent = String(group.count);
    const track = document.createElement("span");
    track.className = "admin-status-track";
    const bar = document.createElement("span");
    bar.className = "admin-status-bar";
    bar.style.width = `${(group.count / maxCount) * 100}%`;
    track.appendChild(bar);
    row.append(label, count, track);
    statusSummary.appendChild(row);
  });

  renderProductSummary();
}

function getProductPerformance() {
  const products = new Map();
  orders.forEach((order, orderIndex) => {
    if (!Array.isArray(order.items)) return;
    order.items.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const name = typeof item.nombre === "string" && item.nombre.trim()
        ? item.nombre.trim()
        : "Producto sin nombre";
      const key = item.id === undefined || item.id === null
        ? `name:${name.toLocaleLowerCase()}`
        : `id:${String(item.id)}`;
      const quantity = Number(item.cantidad);
      if (!Number.isFinite(quantity) || quantity <= 0) return;
      const price = Number(item.precio);
      const product = products.get(key) || {
        name,
        units: 0,
        value: 0,
        orders: new Set()
      };
      product.units += quantity;
      product.value += quantity * (Number.isFinite(price) && price >= 0 ? price : 0);
      product.orders.add(orderIndex);
      products.set(key, product);
    });
  });
  return [...products.values()]
    .map((product) => ({ ...product, orders: product.orders.size }))
    .sort((first, second) => second.units - first.units || second.value - first.value);
}

function renderProductSummary() {
  const products = getProductPerformance();
  productSummary.replaceChildren();
  if (products.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "admin-product-empty";
    emptyState.textContent = "Aún no hay detalle de productos para analizar.";
    productSummary.appendChild(emptyState);
    return;
  }

  const maxUnits = products[0].units;
  products.slice(0, 8).forEach((product, index) => {
    const row = document.createElement("div");
    row.className = "admin-product-row";
    const rank = document.createElement("span");
    rank.className = "admin-product-rank";
    rank.textContent = String(index + 1).padStart(2, "0");

    const details = document.createElement("div");
    details.className = "admin-product-details";
    const name = document.createElement("strong");
    name.className = "admin-product-name";
    name.textContent = product.name;
    const metadata = document.createElement("span");
    metadata.className = "admin-product-meta";
    metadata.textContent = `${product.units} ${product.units === 1 ? "unidad" : "unidades"} · ${product.orders} ${product.orders === 1 ? "pedido" : "pedidos"}`;
    const track = document.createElement("span");
    track.className = "admin-product-track";
    const bar = document.createElement("span");
    bar.className = "admin-product-bar";
    bar.style.width = `${(product.units / maxUnits) * 100}%`;
    track.appendChild(bar);
    details.append(name, metadata, track);

    const value = document.createElement("strong");
    value.className = "admin-product-value";
    value.textContent = formatCurrency(product.value);
    row.append(rank, details, value);
    productSummary.appendChild(row);
  });

  if (products.length > 8) {
    const remaining = document.createElement("p");
    remaining.className = "admin-product-note";
    remaining.textContent = `Mostrando los 8 más pedidos de ${products.length} productos.`;
    productSummary.appendChild(remaining);
  }
}

function csvCell(value) {
  const text = String(value ?? "");
  const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function exportOrders() {
  const exportableOrders = orders;
  const rows = [
    ["Código", "Estado", "Total COP", "Franja", "Cliente", "Correo", "Productos"],
    ...exportableOrders.map((order) => {
      const buyer = order.comprador && typeof order.comprador === "object" ? order.comprador : {};
      const items = Array.isArray(order.items)
        ? order.items.map((item) => `${item.nombre || "Producto"} x${Number(item.cantidad) || 0}`).join("; ")
        : "";
      return [
        order.codigo_unico,
        getStatusLabel(order.estado),
        order.total,
        order.franja_horaria,
        buyer.nombre,
        buyer.correo,
        items
      ];
    })
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `pedidos-etitc-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showMessage(ordersMessage, `Se exportaron ${exportableOrders.length} pedidos.`, "success");
}

function getAdminErrorMessage(error) {
  if (error.code === "PGRST202") {
    return "Faltan las funciones del panel. Ejecuta supabase/admin_panel.sql en el SQL Editor de Supabase.";
  }
  if (error.code === "42501" || error.code === "P0001") {
    return "Esta cuenta inició sesión, pero no tiene permisos de administrador. Revisa la lista privada de administradores en Supabase.";
  }
  return `No se pudo completar la operación: ${error.message || "error inesperado"}`;
}

function getLoginErrorMessage(error) {
  const code = String(error.code || "").toLowerCase();
  const message = String(error.message || "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "Supabase no reconoce esa cuenta o contraseña. Crea admin@example.com en Authentication → Users con la contraseña admin123; después vuelve a ejecutar supabase/admin_panel.sql.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "La cuenta admin@example.com existe, pero su correo no está confirmado. Confírmalo desde Authentication → Users en Supabase.";
  }
  if (code === "provider_disabled" || message.includes("email logins are disabled")) {
    return "El acceso con correo y contraseña está desactivado. Habilita Email en Supabase → Authentication → Sign In / Providers.";
  }
  if (error instanceof TypeError || message.includes("failed to fetch")) {
    return "No se pudo conectar con Supabase. Comprueba tu conexión y que la URL y la clave pública del proyecto sean correctas.";
  }
  return `Supabase rechazó el inicio de sesión: ${error.message || "error sin detalle"}`;
}

async function loadOrders() {
  refreshButton.disabled = true;
  showMessage(ordersMessage, "Cargando pedidos…");
  ordersList.replaceChildren();

  try {
    const { data, error } = await supabase.rpc("admin_listar_ordenes");
    if (error) throw error;

    orders = Array.isArray(data) ? data : [];
    renderDashboard();
    renderOrders();
  } catch (error) {
    console.error("Error al cargar los pedidos:", error);
    showMessage(ordersMessage, getAdminErrorMessage(error), "error");
  } finally {
    refreshButton.disabled = false;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginButton.disabled = true;
  loginButton.textContent = "Validando...";
  showMessage(loginMessage, "Iniciando sesión…");

  const username = document.getElementById("admin-username").value.trim().toLowerCase();
  const password = document.getElementById("admin-password").value;

  try {
    if (username !== adminUsername) {
      showMessage(loginMessage, "Usuario o contraseña incorrectos.", "error");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password
    });
    if (error) throw error;
    loginForm.reset();
    setAuthenticated(data.session);
    showMessage(ordersMessage, "Sesión iniciada. Comprobando permisos…");
    await loadOrders();
  } catch (error) {
    console.error("Error al iniciar sesión de administrador:", error);
    showMessage(loginMessage, getLoginErrorMessage(error), "error");
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Iniciar sesión";
  }
});

refreshButton.addEventListener("click", loadOrders);
exportButton.addEventListener("click", exportOrders);
viewButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.adminView));
});
dashboardView.addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-filter]");
  if (!button) return;
  statusFilter.value = button.dataset.adminFilter;
  orderSearchInput.value = "";
  setView("orders");
});
orderSearchInput.addEventListener("input", renderOrders);
statusFilter.addEventListener("change", renderOrders);
clearSearchButton.addEventListener("click", () => {
  orderSearchInput.value = "";
  renderOrders();
  orderSearchInput.focus();
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setAuthenticated(null);
    showMessage(loginMessage, "Sesión cerrada correctamente.", "success");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    showMessage(ordersMessage, `No se pudo cerrar la sesión: ${error.message || "error inesperado"}`, "error");
  } finally {
    logoutButton.disabled = false;
  }
});

supabase.auth.onAuthStateChange((_event, session) => {
  setAuthenticated(session);
});

const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (sessionError) {
  console.error("Error al recuperar la sesión:", sessionError);
  showMessage(loginMessage, "No se pudo comprobar la sesión. Recarga la página e inténtalo de nuevo.", "error");
} else if (sessionData.session) {
  setAuthenticated(sessionData.session);
  await loadOrders();
}
