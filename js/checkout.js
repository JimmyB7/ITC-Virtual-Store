import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import SUPABASE_KEYS from "../assets/Keys.js";

const supabase = createClient(SUPABASE_KEYS.url, SUPABASE_KEYS.anonKey);

const $form = document.getElementById("checkout-form");
const $totalTxt = document.getElementById("checkout-total");

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
  window.location.href = "./index.html";
}

const totalCalculado = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
if ($totalTxt) {
  $totalTxt.textContent = FormatoDeMoneda(totalCalculado);
}

// Proceso de validación y pago
$form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim().toLowerCase();
  const comprobante = document.getElementById("comprobante").value.trim();

  // Validar correo institucional
  if (!correo.endsWith("@itc.edu.co")) {
    alert("Error: Solo se permiten correos institucionales terminados en @itc.edu.co");
    return;
  }

  const $btn = document.getElementById("btn-confirmar-pago");
  $btn.disabled = true;
  $btn.textContent = "Verificando transferencia Nequi...";

  // Simulación de delay de verificación automática de la transacción (2.5 segundos)
  setTimeout(async () => {
    try {
      // Generar un código único para la orden
      const codigoOrden = 'PED-' + Math.floor(100000 + Math.random() * 900000);

      // Registrar en Supabase la orden verificada incluyendo código y franja horaria requerida
      const { data, error } = await supabase
        .from("ordenes")
        .insert([
          {
            codigo_unico: codigoOrden,
            franja_horaria: "General",
            items: carrito,
            total: totalCalculado,
            estado: "VERIFICADO_NEQUI",
            comprador: {
              nombre: nombre,
              correo: correo,
              metodo_pago: "QR_NEQUI",
              referencia_nequi: comprobante
            }
          }
        ])
        .select();

      if (error) throw error;

      // Limpiar datos locales
      localStorage.removeItem("carritoETITC");

      // Redirigir a pantalla de confirmación
      window.location.href = "./success.html";

    } catch (err) {
      console.error("Error al verificar el pago:", err);
      alert("Error al validar el pago con Nequi: " + err.message);
      $btn.disabled = false;
      $btn.textContent = "Verificar y Finalizar Pago";
    }
  }, 2500);
});