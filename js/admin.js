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
const orderSearchInput = document.getElementById("admin-order-search-input");
const clearSearchButton = document.getElementById("admin-order-search-clear");
let orders = [];
const statusChoices = [
  { value: "PAGO_SIMULADO", label: "Pago de prueba registrado (Bre-B)" },
  { value: "PREPARANDO", label: "Preparando en papelería" },
  { value: "LISTO_PARA_RECOGER", label: "Listo para recoger" },
  { value: "ENTREGADO", label: "Entregado" }
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
  loginPanel.hidden = isAuthenticated;
  ordersPanel.hidden = !isAuthenticated;
  sessionUser.textContent = isAuthenticated ? session.user.email || "Sesión autenticada" : "";
  if (!isAuthenticated) {
    orders = [];
    ordersList.replaceChildren();
    orderSearchInput.value = "";
  }
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
  status.textContent = currentStatus?.label || order.estado || "Sin estado";
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

function renderOrders() {
  const searchTerm = orderSearchInput.value.trim().toLocaleLowerCase();
  clearSearchButton.hidden = !searchTerm;
  const filteredOrders = orders.filter((order) =>
    String(order.codigo_unico || "").toLocaleLowerCase().includes(searchTerm)
  );
  ordersList.replaceChildren();

  if (filteredOrders.length === 0) {
    showMessage(
      ordersMessage,
      searchTerm ? "No se encontraron pedidos con ese número de orden." : "No hay pedidos registrados todavía."
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  filteredOrders.forEach((order) => fragment.appendChild(renderOrder(order)));
  ordersList.appendChild(fragment);
  const countMessage = searchTerm
    ? `${filteredOrders.length} pedido${filteredOrders.length === 1 ? "" : "s"} encontrado${filteredOrders.length === 1 ? "" : "s"}.`
    : `${filteredOrders.length} pedido${filteredOrders.length === 1 ? "" : "s"} cargado${filteredOrders.length === 1 ? "" : "s"}.`;
  showMessage(ordersMessage, countMessage, "success");
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
orderSearchInput.addEventListener("input", renderOrders);
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
