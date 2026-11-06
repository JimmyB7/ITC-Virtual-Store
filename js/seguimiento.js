import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import SUPABASE_KEYS from "../assets/Keys.js";

const supabase = createClient(SUPABASE_KEYS.url, SUPABASE_KEYS.anonKey);
const form = document.getElementById("seguimiento-form");
const input = document.getElementById("codigo-orden");
const submit = document.getElementById("seguimiento-submit");
const message = document.getElementById("seguimiento-mensaje");
const result = document.getElementById("seguimiento-resultado");
const statusText = document.getElementById("estado-orden");
const resultCode = document.getElementById("codigo-resultado");
const steps = [...document.querySelectorAll(".timeline-step")];
const codigoValido = /^PED-[A-F0-9]{24}$/;
const estados = {
  PAGO_SIMULADO: { label: "Pago de prueba registrado (Bre-B)", step: 0 },
  VERIFICADO_NEQUI: { label: "Pago registrado (orden anterior)", step: 0 },
  PREPARANDO: { label: "Preparando en papelería", step: 1 },
  PREPARANDO_EN_PAPELERIA: { label: "Preparando en papelería", step: 1 },
  LISTO_PARA_RECOGER: { label: "Listo para recoger en el campus ETITC", step: 2 },
  LISTO_PARA_RECOGER_EN_CAMPUS_ETITC: { label: "Listo para recoger en el campus ETITC", step: 2 },
  ENTREGADO: { label: "Pedido entregado", step: 3 }
};

let codigoConsultado = "";
let intervaloActualizacion = 0;
let consultando = false;

function mostrarMensaje(texto, tipo = "") {
  message.textContent = texto;
  message.className = `seguimiento-mensaje${tipo ? ` ${tipo}` : ""}`;
}

function actualizarTimeline(estado) {
  const detalle = estados[estado];
  statusText.textContent = detalle?.label || `Estado registrado: ${estado.replaceAll("_", " ").toLowerCase()}`;

  steps.forEach((paso, index) => {
    paso.classList.toggle("completado", Boolean(detalle) && index < detalle.step);
    paso.classList.toggle("actual", Boolean(detalle) && index === detalle.step);
  });
}

async function consultarEstado({ silenciosa = false } = {}) {
  if (!codigoConsultado || consultando) return;
  consultando = true;

  if (!silenciosa) {
    submit.disabled = true;
    submit.querySelector("span").textContent = "Consultando...";
    mostrarMensaje("Buscando tu orden…");
  }

  try {
    const { data, error } = await supabase.rpc("consultar_estado_orden", {
      p_codigo: codigoConsultado
    });

    if (error) throw error;

    const orden = Array.isArray(data) ? data[0] : null;
    if (!orden) {
      window.clearInterval(intervaloActualizacion);
      intervaloActualizacion = 0;
      result.hidden = true;
      mostrarMensaje("No encontramos una orden con ese código. Revisa que lo hayas copiado completo.", "error");
      return;
    }

    actualizarTimeline(String(orden.estado || "").toUpperCase());
    resultCode.textContent = orden.codigo_unico;
    result.hidden = false;
    mostrarMensaje(silenciosa ? "Estado actualizado." : "Orden encontrada. Última consulta: ahora.", "exito");

    if (!intervaloActualizacion) {
      intervaloActualizacion = window.setInterval(() => {
        if (!document.hidden) consultarEstado({ silenciosa: true });
      }, 20000);
    }
  } catch (error) {
    console.error("Error al consultar el estado de la orden:", error);
    if (error.code === "PGRST202") {
      mostrarMensaje("El seguimiento aún no está configurado en la base de datos. El administrador debe ejecutar el archivo supabase/seguimiento_orden.sql en el SQL Editor de Supabase y volver a intentarlo.", "error");
    } else {
      mostrarMensaje("No se pudo consultar el estado. Comprueba tu conexión e inténtalo de nuevo.", "error");
    }
  } finally {
    consultando = false;
    submit.disabled = false;
    submit.querySelector("span").textContent = "Consultar";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const codigo = input.value.trim().toUpperCase();

  if (!codigoValido.test(codigo)) {
    window.clearInterval(intervaloActualizacion);
    intervaloActualizacion = 0;
    result.hidden = true;
    mostrarMensaje("El código debe tener el formato PED- seguido de 24 caracteres hexadecimales.", "error");
    input.focus();
    return;
  }

  codigoConsultado = codigo;
  consultarEstado();
});

const codigoInicial = new URLSearchParams(window.location.search).get("codigo");
if (codigoInicial) {
  input.value = codigoInicial.toUpperCase();
  form.requestSubmit();
}
