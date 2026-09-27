import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

        productos.forEach(producto => {
            const clone = productoTemplate.content.cloneNode(true);

            clone.querySelector('img').src = producto.imagen || 'images/default.png';
            clone.querySelector('img').alt = producto.nombre;
            clone.querySelector('.producto-title').textContent = producto.nombre;
            clone.querySelector('.producto-precio').textContent = `$${Number(producto.precio).toLocaleString()}`;

            const btnComprar = clone.querySelector('.btn-comprar');
            btnComprar.addEventListener('click', () => {
                agregarAlCarrito(producto);
            });

            productosContainer.appendChild(clone);
        });

    } catch (error) {
        console.error('Error al cargar productos:', error);
        productosContainer.innerHTML = '<p class="cargando">Error al conectar con la base de datos de Supabase. Revisa tus credenciales.</p>';
    }
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

        divItem.innerHTML = `
            <span>${item.nombre} (x${item.cantidad}) - $${(item.precio * item.cantidad).toLocaleString()}</span>
            <button class="btn-eliminar-uno" title="Restar uno" type="button">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        divItem.querySelector('.btn-eliminar-uno').addEventListener('click', () => {
            disminuirCantidad(item.id);
        });

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
    
    window.location.href = 'checkout.html';
}

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarCarrito();

    // Conectar el botón de pagar asegurando el listener de eventos
    const btnPagarModoPrueba = document.getElementById('btn-pagar'); 
    if (btnPagarModoPrueba) {
        btnPagarModoPrueba.addEventListener('click', procederAlCheckout);
    }
});