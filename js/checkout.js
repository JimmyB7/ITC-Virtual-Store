import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import SUPABASE_KEYS from "../assets/Keys.js";
import { initEfectos3D } from './efectos3d.js';

const supabase = createClient(SUPABASE_KEYS.url, SUPABASE_KEYS.anonKey);

const $form = document.getElementById("checkout-form");
const $totalTxt = document.getElementById("checkout-total");
const $correo = document.getElementById("correo");
const $correoError = document.getElementById("correo-error");

// Recuperar productos guardados
const carrito = JSON.parse(localStorage.getItem("carritoETITC")) || [];

const FormatoDeMoneda = (num) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(num);
};

// Si el carrito está vacío, volver al inicio
if (carrito.length === 0) {
  window.location.href = "../index.html";
}

const totalCalculado = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
if ($totalTxt) {
  $totalTxt.textContent = FormatoDeMoneda(totalCalculado);
}

// Efectos 3D del checkout (tilt suave; se pausa mientras el usuario escribe)
initEfectos3D();

/* ---------- Validación de correo: cualquier dominio, solo formato básico ---------- */
// usuario@dominio.ext  (sin espacios, un solo @, dominio con al menos un punto y extensión de 2+ letras)
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const esCorreoValido = (correo) => correo.length <= 254 && REGEX_CORREO.test(correo);

function generarCodigoOrden() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const codigoAleatorio = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `PED-${codigoAleatorio}`;
}

function mostrarErrorCorreo(mensaje) {
  $correoError.textContent = mensaje;
  $correo.setAttribute("aria-invalid", "true");
  $correo.classList.remove("input-error");
  void $correo.offsetWidth; // reinicia la animación de temblor
  $correo.classList.add("input-error");
  $correo.focus();
}

function limpiarErrorCorreo() {
  $correoError.textContent = "";
  $correo.removeAttribute("aria-invalid");
  $correo.classList.remove("input-error");
}

$correo.addEventListener("input", limpiarErrorCorreo);

// Proceso de validación y pago
$form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const correo = $correo.value.trim().toLowerCase();
  const comprobante = document.getElementById("comprobante").value.trim();

  // Validar formato de correo (acepta @gmail.com, @outlook.com, institucionales, etc.)
  if (!esCorreoValido(correo)) {
    mostrarErrorCorreo("Ingresa un correo válido, por ejemplo: nombre@gmail.com");
    return;
  }

  const $btn = document.getElementById("btn-confirmar-pago");
  $btn.disabled = true;
  $btn.textContent = "Registrando pago de prueba...";

  // El flujo es una demostración y no consulta ni confirma transacciones bancarias.
  setTimeout(async () => {
    try {
      // Generar un código único para la orden
      const codigoOrden = generarCodigoOrden();

      // Registrar la orden como pago simulado; la referencia no se verifica con un banco.
      const { data, error } = await supabase
        .from("ordenes")
        .insert([
          {
            codigo_unico: codigoOrden,
            franja_horaria: "General",
            items: carrito,
            total: totalCalculado,
            estado: "PAGO_SIMULADO",
            comprador: {
              nombre: nombre,
              correo: correo,
              metodo_pago: "BRE_B_SIMULADO",
              referencia_pago: comprobante
            }
          }
        ])
        .select();

      if (error) throw error;

      // Limpiar datos locales
      localStorage.removeItem("carritoETITC");

      // Redirigir a pantalla de confirmación
      window.location.href = `../pages/success.html?orden=${encodeURIComponent(codigoOrden)}`;

    } catch (err) {
      console.error("Error al registrar el pago de prueba:", err);
      alert("Error al registrar el pago de prueba: " + err.message);
      $btn.disabled = false;
      $btn.textContent = "Registrar pago de prueba";
    }
  }, 2500);
});