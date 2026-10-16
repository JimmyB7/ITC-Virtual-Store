
document.documentElement.classList.add('js-3d');

const mqReducir = window.matchMedia('(prefers-reduced-motion: reduce)');
const mqPuntero = window.matchMedia('(hover: hover) and (pointer: fine)');

export const puedeAnimar3D = () => !mqReducir.matches && mqPuntero.matches;

/* ---------------------------------------------------------------
   TILT 3D + GLARE
   Uso: <div data-tilt data-tilt-max="8"></div>  ó  initTilt(el, { max: 8 })
---------------------------------------------------------------- */
export function initTilt(el, opciones = {}) {
  if (!el || el.dataset.tiltListo) return;
  el.dataset.tiltListo = '1';
  if (!puedeAnimar3D()) return;

  const max = Number(el.dataset.tiltMax) || opciones.max || 10;
  const escala = Number(el.dataset.tiltScale) || opciones.scale || 1.03;
  const perspectiva = opciones.perspective || 1000;
  const pausarEnFoco = el.hasAttribute('data-tilt-pausar-foco');

  let rect = null;
  let raf = 0;
  let px = 0.5;
  let py = 0.5;

  const plano = `perspective(${perspectiva}px) rotateX(0deg) rotateY(0deg) scale(1)`;

  const pintar = () => {
    raf = 0;
    const rx = (0.5 - py) * 2 * max; // el borde bajo el cursor se "hunde"
    const ry = (px - 0.5) * 2 * max;
    el.style.transform =
      `perspective(${perspectiva}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${escala})`;
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    el.style.setProperty('--sx', `${(-ry * 1.6).toFixed(1)}px`);
    el.style.setProperty('--sy', `${(rx * 1.6 + 18).toFixed(1)}px`);
  };

  const reiniciar = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    el.classList.remove('is-tilting');
    el.style.transform = plano;
    el.style.removeProperty('--sx');
    el.style.removeProperty('--sy');
  };

  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    rect = el.getBoundingClientRect();
    el.classList.add('is-tilting');
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    if (pausarEnFoco && el.matches(':focus-within')) {
      reiniciar();
      return;
    }
    if (!el.classList.contains('is-tilting')) el.classList.add('is-tilting');
    if (!rect) rect = el.getBoundingClientRect();
    px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    if (!raf) raf = requestAnimationFrame(pintar);
  });

  el.addEventListener('pointerleave', () => {
    rect = null;
    reiniciar();
  });

  // Si la página hace scroll mientras el cursor está encima, la caché de medidas queda vieja.
  window.addEventListener('scroll', () => { rect = null; }, { passive: true });
  window.addEventListener('resize', () => { rect = null; }, { passive: true });
}

/* ---------------------------------------------------------------
   REVEAL AL HACER SCROLL (animación de entrada escalonada)
   Uso: <div class="reveal" style="--i:2"></div>
---------------------------------------------------------------- */
let observador = null;

function obtenerObservador() {
  if (observador || !('IntersectionObserver' in window)) return observador;
  observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  return observador;
}

export function observarReveal(el) {
  if (!el || el.dataset.revealListo) return;
  el.dataset.revealListo = '1';
  const obs = obtenerObservador();
  if (!obs || mqReducir.matches) {
    el.classList.add('visible');
    return;
  }
  obs.observe(el);
}

/* ---------------------------------------------------------------
   HERO: la pila de capas sigue al cursor (en táctil gira sola por CSS)
---------------------------------------------------------------- */
export function initHeroParallax() {
  const hero = document.querySelector('.hero');
  const pila = document.querySelector('.hero-stack');
  if (!hero || !pila || !puedeAnimar3D()) return;

  let raf = 0;
  let nx = 0;
  let ny = 0;

  const pintar = () => {
    raf = 0;
    pila.style.setProperty('--hry', `${(18 + nx * 22).toFixed(1)}deg`);
    pila.style.setProperty('--hrx', `${(-12 - ny * 16).toFixed(1)}deg`);
  };

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(pintar);
  });

  hero.addEventListener('pointerleave', () => {
    nx = 0;
    ny = 0;
    if (!raf) raf = requestAnimationFrame(pintar);
  });
}

/* ---------------------------------------------------------------
   Arranque general (idempotente: se puede llamar más de una vez)
---------------------------------------------------------------- */
export function initEfectos3D() {
  document.querySelectorAll('[data-tilt]').forEach((el) => initTilt(el));
  document.querySelectorAll('.reveal').forEach((el) => observarReveal(el));
  initHeroParallax();

  // Red de seguridad: si algo no se activó, nada queda invisible.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach((el) => el.classList.add('visible'));
  }, 4000);
}