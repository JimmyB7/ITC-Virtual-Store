import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { initEfectos3D, initTilt, observarReveal } from './efectos3d.js';

const SUPABASE_URL = 'https://aeocbyaaeolffaccsfgj.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_jw_FMN_9x6V75C3DDx9-KQ__4Q3tbbW';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let carrito = [];

const btnAbrirCarrito = document.getElementById('btn-abrir-carrito');
const carritoModal = document.getElementById('carrito-modal');
const carritoLista = document.getElementById('carrito-lista');
const carritoContador = document.getElementById('carrito-contador');
const carritoTotal = document.getElementById('carrito-total');
const productosContainer = document.getElementById('productos');
const productoTemplate = document.getElementById('producto-template');

btnAbrirCarrito.addEventListener('click', () => {
    carritoModal.classList.toggle('oculto');
});

// Cargar productos directamente del esquema public por defecto
async function cargarProductos() {
    try {
        const { data: productos, error } = await supabase
            .from('productos')
            .select('*');

        if (error) throw error;

        productosContainer.innerHTML = '';

        if (!productos || productos.length === 0) {
            productosContainer.innerHTML = '<p class="cargando">No hay productos disponibles por el momento.</p>';
            return;
        }

        productos.forEach((producto, index) => {
            const clone = productoTemplate.content.cloneNode(true);
            const card = clone.querySelector('.producto-card');

            const rutaImagen = producto.imagen || 'assets/images/ETITC.png';
            clone.querySelector('img').src = rutaImagen.replace(/^\.?\/?images\//, 'assets/images/');
            clone.querySelector('img').alt = producto.nombre;
            clone.querySelector('.producto-title').textContent = producto.nombre;
            clone.querySelector('.producto-precio').textContent = `$${Number(producto.precio).toLocaleString()}`;

            const btnComprar = clone.querySelector('.btn-comprar');
            btnComprar.addEventListener('click', () => {
                agregarAlCarrito(producto);
                animarBotonAgregado(btnComprar);
            });

            // Efectos 3D: entrada escalonada + tilt (el stagger se limita para listas largas)
            card.style.setProperty('--i', Math.min(index, 8));

            productosContainer.appendChild(clone);

            initTilt(card, { max: 9, scale: 1.035 });
            observarReveal(card);
        });

    } catch (error) {
        console.error('Error al cargar productos:', error);
        productosContainer.innerHTML = '<p class="cargando">Error al conectar con la base de datos de Supabase. Revisa tus credenciales.</p>';
    }
}

function animarBotonAgregado(btn) {
    btn.classList.remove('agregado');
    void btn.offsetWidth; // reinicia la animación si se hace clic varias veces seguidas
    btn.classList.add('agregado');
}

function agregarAlCarrito(producto) {
    const productoExistente = carrito.find(item => item.id === producto.id);
    
    if (productoExistente) {
        productoExistente.cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            cantidad: 1
        });
    }
    
    actualizarCarrito();

    // Pequeño rebote del contador del carrito
    carritoContador.classList.remove('bump');
    void carritoContador.offsetWidth;
    carritoContador.classList.add('bump');
}

function disminuirCantidad(id) {
    const index = carrito.findIndex(item => item.id === id);
    if (index !== -1) {
        carrito[index].cantidad -= 1;
        if (carrito[index].cantidad <= 0) {
            carrito.splice(index, 1);
        }
    }
    actualizarCarrito();
}

function actualizarCarrito() {
    carritoLista.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    if (carrito.length === 0) {
        carritoLista.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 10px;">Tu carrito está vacío</p>';
    }

    carrito.forEach(item => {
        total += item.precio * item.cantidad;
        totalItems += item.cantidad;

        const divItem = document.createElement('div');
        divItem.classList.add('item-carrito');

        // El nombre se inserta con textContent (evita inyección de HTML desde la BD)
        const spanNombre = document.createElement('span');
        spanNombre.textContent = `${item.nombre} (x${item.cantidad}) - $${(item.precio * item.cantidad).toLocaleString()}`;

        const btnRestar = document.createElement('button');
        btnRestar.className = 'btn-eliminar-uno';
        btnRestar.title = 'Restar uno';
        btnRestar.type = 'button';
        btnRestar.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        btnRestar.addEventListener('click', () => {
            disminuirCantidad(item.id);
        });

        divItem.append(spanNombre, btnRestar);
        carritoLista.appendChild(divItem);
    });

    carritoContador.textContent = totalItems;
    carritoTotal.textContent = `$${total.toLocaleString()}`;
}

// Función para ir al checkout pasando los datos del carrito
function procederAlCheckout(e) {
    if (e) e.preventDefault();

    if (carrito.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de pagar.');
        return;
    }

    // Usar la misma llave de almacenamiento que lee el checkout.js
    localStorage.setItem('carritoETITC', JSON.stringify(carrito));
    
    window.location.href = 'pages/checkout.html';
}

document.addEventListener('DOMContentLoaded', () => {
    initEfectos3D();
    cargarProductos();
    actualizarCarrito();

    // Conectar el botón de pagar asegurando el listener de eventos
    const btnPagarModoPrueba = document.getElementById('btn-pagar'); 
    if (btnPagarModoPrueba) {
        btnPagarModoPrueba.addEventListener('click', procederAlCheckout);
    }
});