document.addEventListener("DOMContentLoaded", () => {
  const chatWidget = document.createElement("section");
  chatWidget.className = "chatbot-widget";
  chatWidget.setAttribute("aria-label", "Asistente virtual ETITC");
  chatWidget.innerHTML = `
    <button
      id="btn-abrir-chat"
      class="btn-chatbot"
      type="button"
      aria-label="Abrir asistente virtual"
      aria-controls="chat-modal"
      aria-expanded="false"
    >
      <i class="fa-solid fa-headset" aria-hidden="true"></i>
      <span class="chatbot-tooltip">¿Dudas? Chatea aquí</span>
    </button>

    <div id="chat-modal" class="chat-modal oculto" aria-label="Chat con el asistente ETITC">
      <div class="chat-header">
        <div class="chat-title-info">
          <i class="fa-solid fa-robot" aria-hidden="true"></i>
          <div>
            <h2>Asistente ETITC</h2>
            <span class="chat-status">En línea</span>
          </div>
        </div>
        <button id="btn-cerrar-chat" class="btn-cerrar-chat" type="button" aria-label="Cerrar chat">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>

      <div id="chat-mensajes" class="chat-mensajes" role="log" aria-live="polite" aria-relevant="additions">
        <div class="chat-msg bot">
          ¡Hola! Soy el asistente de ETITC Store. Puedo orientarte sobre productos, carrito, pagos de prueba por Bre-B, recogida y más. Elige una pregunta o escríbeme.
        </div>
      </div>

      <div class="chat-footer">
        <div class="chat-suggestions" aria-label="Preguntas frecuentes">
          <button class="chat-suggestion-chip" type="button">
            <i class="fa-solid fa-wallet" aria-hidden="true"></i>
            <span>¿Cómo pago?</span>
          </button>
          <button class="chat-suggestion-chip" type="button">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            <span>¿Dónde recojo mi pedido?</span>
          </button>
          <button class="chat-suggestion-chip" type="button">
            <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
            <span>¿Cómo agrego o quito productos?</span>
          </button>
          <button class="chat-suggestion-chip" type="button">
            <i class="fa-solid fa-box-open" aria-hidden="true"></i>
            <span>¿Qué productos tienen?</span>
          </button>
          <button class="chat-suggestion-chip" type="button">
            <i class="fa-solid fa-tag" aria-hidden="true"></i>
            <span>¿Hay descuentos?</span>
          </button>
          <button class="chat-suggestion-chip" type="button">
            <i class="fa-solid fa-receipt" aria-hidden="true"></i>
            <span>¿Cómo consulto mi pedido?</span>
          </button>
          <button class="chat-suggestion-chip" type="button">
            <i class="fa-solid fa-clock" aria-hidden="true"></i>
            <span>¿Cuáles son los horarios?</span>
          </button>
          <button class="chat-suggestion-chip" type="button">
            <i class="fa-solid fa-headset" aria-hidden="true"></i>
            <span>Necesito hablar con soporte</span>
          </button>
        </div>

        <form id="chat-form" class="chat-input-wrapper">
          <input
            id="chat-input"
            type="text"
            placeholder="Escribe tu consulta..."
            aria-label="Escribe tu consulta para el chatbot"
            autocomplete="off"
            maxlength="500"
            required
          >
          <button class="chat-send-btn" type="submit" aria-label="Enviar mensaje">
            <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>
          </button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(chatWidget);

  const btnAbrir = chatWidget.querySelector("#btn-abrir-chat");
  const btnCerrar = chatWidget.querySelector("#btn-cerrar-chat");
  const modalChat = chatWidget.querySelector("#chat-modal");
  const formChat = chatWidget.querySelector("#chat-form");
  const inputChat = chatWidget.querySelector("#chat-input");
  const contenedorMensajes = chatWidget.querySelector("#chat-mensajes");

  function abrirChat() {
    modalChat.classList.remove("oculto");
    btnAbrir.setAttribute("aria-expanded", "true");
    inputChat.focus();
  }

  function cerrarChat() {
    modalChat.classList.add("oculto");
    btnAbrir.setAttribute("aria-expanded", "false");
    btnAbrir.focus();
  }

  btnAbrir.addEventListener("click", () => {
    if (modalChat.classList.contains("oculto")) {
      abrirChat();
    } else {
      cerrarChat();
    }
  });

  btnCerrar.addEventListener("click", cerrarChat);

  chatWidget.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalChat.classList.contains("oculto")) {
      cerrarChat();
    }
  });

  function normalizar(mensaje) {
    return mensaje
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function obtenerRespuestaBot(mensaje) {
    const texto = normalizar(mensaje);

    if (/^(hola|buenos dias|buenas tardes|buenas noches|saludos)[!. ]*$/.test(texto)) {
      return "¡Hola! Puedo ayudarte con el catálogo, el carrito, el pago de prueba por Bre-B, la recogida y dudas sobre pedidos. ¿Qué necesitas?";
    }
    if (/^(gracias|muchas gracias|te agradezco|muy amable)[!. ]*$/.test(texto)) {
      return "¡Con gusto! Si te queda otra duda sobre la tienda, aquí estoy para orientarte.";
    }
    if (/^(chao|adios|hasta luego|nos vemos)[!. ]*$/.test(texto)) {
      return "¡Hasta luego! Recuerda que puedes consultar el catálogo y revisar el total en tu carrito.";
    }
    if (/\b(horario|horarios|abren|abierto|cierran|atienden)\b/.test(texto)) {
      return "No tengo horarios de atención confirmados en este momento. Para evitar darte un dato incorrecto, consulta los canales oficiales de la tienda antes de acercarte.";
    }
    if (/\b(nequi|bre[\s-]?b|llave|pago|pagar|qr|transferencia|comprobante|referencia)\b/.test(texto)) {
      return "Agrega los productos al carrito y selecciona Pagar. El checkout es una simulación del flujo por llave Bre-B: ingresa una referencia de prueba para registrar el pedido. No se realiza ni se verifica una transferencia bancaria real.";
    }
    if (/\b(recojo|recoger|recogida|entrega|campus|ubicacion|direccion)\b/.test(texto)) {
      return "Los pedidos están pensados para recogerse en el campus de la ETITC. Revisa la información de tu orden para coordinar la recogida.";
    }
    if (/\b(descuento|descuentos|promocion|promociones|oferta|ofertas)\b/.test(texto)) {
      return "Las promociones vigentes pueden cambiar. Revisa los canales oficiales de la tienda; los precios disponibles se muestran en cada tarjeta del catálogo.";
    }
    if (/\b(precio|precios|barato|cuesta|cuestan|cost|cuanto|valor)\b/.test(texto)) {
      return "Puedes consultar los precios actuales directamente en las tarjetas del catálogo. Para descuentos o promociones vigentes, consulta los canales oficiales de la tienda.";
    }
    if (/\b(carrito|agregar|agrego|anadir|añadir|quitar|eliminar|borrar|vaciar|comprar|compra)\b/.test(texto)) {
      return "Para agregar un artículo, pulsa «Agregar al Carrito» en su tarjeta. Abre el carrito para revisar cantidades y total; el botón con la papelera resta una unidad. Cuando esté listo, pulsa «Pagar» para continuar al checkout.";
    }
    if (/\b(pedido|orden|estado|seguimiento|rastrear|confirmacion|confirmar)\b/.test(texto)) {
      return "Puedes consultar el estado de tu compra en la sección Seguimiento usando el código único que aparece al finalizar el checkout. El estado se actualiza automáticamente mientras la página está abierta.";
    }
    if (/\b(devolucion|devolver|cambio|cambios|reembolso|garantia)\b/.test(texto)) {
      return "No tengo una política de cambios o devoluciones confirmada. Consulta los canales oficiales de la tienda para conocer las condiciones antes de hacer tu pedido.";
    }
    if (/\b(contacto|soporte|ayuda|humano|persona|asesor|desarrolladores)\b/.test(texto)) {
      return "Puedo orientarte sobre el catálogo, el carrito y el proceso de compra. Para soporte de un pedido, comunícate con el equipo de la tienda por sus canales oficiales.";
    }
    if (/\b(producto|productos|catalogo|utiles|papeleria|disponible|disponibilidad|stock|tienen|venden|marca)\b/.test(texto)) {
      return "En el catálogo puedes ver los productos que la tienda tiene publicados, junto con su precio. La disponibilidad puede cambiar; si un artículo no aparece, consulta con el equipo de la tienda.";
    }

    return "No reconocí esa consulta. Puedo ayudarte con productos y precios, cómo usar el carrito, pagos de prueba, recogida, horarios, pedidos, descuentos o cambios. Prueba con una de las preguntas sugeridas o escríbeme de otra forma.";
  }

  function agregarMensaje(texto, remitente) {
    const mensaje = document.createElement("div");
    mensaje.className = `chat-msg ${remitente}`;
    mensaje.textContent = texto;
    contenedorMensajes.appendChild(mensaje);
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
  }

  function procesarMensaje(textoUsuario) {
    const texto = textoUsuario.trim();
    if (!texto) return;

    agregarMensaje(texto, "usuario");
    inputChat.value = "";

    window.setTimeout(() => {
      agregarMensaje(obtenerRespuestaBot(texto), "bot");
    }, 350);
  }

  formChat.addEventListener("submit", (event) => {
    event.preventDefault();
    procesarMensaje(inputChat.value);
    inputChat.focus();
  });

  chatWidget.querySelectorAll(".chat-suggestion-chip").forEach((boton) => {
    boton.addEventListener("click", () => {
      procesarMensaje(boton.textContent);
      inputChat.focus();
    });
  });
});
