// Número de WhatsApp del negocio en formato internacional sin "+" ni espacios (ej: 57300xxxxxxx)
const NUMERO_WHATSAPP = "573000000000";
const CART_KEY = "dressup-carrito";

const formatoPrecio = (valor) => "$" + Number(valor).toLocaleString("es-CO") + " COP";

// ---- Carrito (guardado en el navegador) ----
function leerCarrito() {
  try {
    const datos = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(datos)) return [];
    // Descarta productos dañados para que el carrito nunca se rompa
    return datos.filter(
      (p) => p && typeof p.nombre === "string" && Number(p.precio) >= 0 && Number(p.cantidad) > 0
    );
  } catch (e) {
    return [];
  }
}

function guardarCarrito(carrito) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(carrito));
  } catch (e) {}
  pintarCarrito();
}

function agregarAlCarrito(producto) {
  const carrito = leerCarrito();
  const existente = carrito.find((p) => p.nombre === producto.nombre);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  guardarCarrito(carrito);
  setTimeout(rebotarContador, 650);
}

function cambiarCantidad(nombre, delta) {
  const carrito = leerCarrito()
    .map((p) => (p.nombre === nombre ? { ...p, cantidad: p.cantidad + delta } : p))
    .filter((p) => p.cantidad > 0);
  guardarCarrito(carrito);
}

function totalCarrito(carrito) {
  return carrito.reduce((suma, p) => suma + p.precio * p.cantidad, 0);
}

function pintarCarrito() {
  const carrito = leerCarrito();
  const unidades = carrito.reduce((suma, p) => suma + p.cantidad, 0);

  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = unidades;
    el.dataset.count = unidades;
  });

  const lista = document.getElementById("cartItems");
  if (!lista) return;

  if (carrito.length === 0) {
    lista.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
  } else {
    lista.innerHTML = "";
    carrito.forEach((p) => {
      const item = document.createElement("div");
      item.className = "cart-item";
      item.innerHTML = `
        <img src="${encodeURI(p.imagen)}" alt="">
        <div>
          <div class="ci-name"></div>
          <div class="ci-price">${formatoPrecio(p.precio)}</div>
        </div>
        <div class="qty">
          <button type="button" aria-label="Quitar uno">−</button>
          <span>${p.cantidad}</span>
          <button type="button" aria-label="Agregar uno">+</button>
        </div>`;
      item.querySelector(".ci-name").textContent = p.nombre;
      const [menos, mas] = item.querySelectorAll(".qty button");
      menos.addEventListener("click", () => cambiarCantidad(p.nombre, -1));
      mas.addEventListener("click", () => cambiarCantidad(p.nombre, 1));
      lista.appendChild(item);
    });
  }

  document.getElementById("cartTotal").textContent = formatoPrecio(totalCarrito(carrito));
  document.getElementById("checkoutBtn").disabled = carrito.length === 0;
}

// ---- Página del catálogo ----
function iniciarCatalogo() {
  const catalogo = document.getElementById("catalog");
  if (!catalogo) return;

  const tarjetas = [...catalogo.querySelectorAll(".product-card")];

  tarjetas.forEach((card, i) => {
    const { nombre, precio, imagen, nuevo } = card.dataset;
    const enlacePedido =
      "pedido.html?producto=" + encodeURIComponent(nombre) +
      "&precio=" + encodeURIComponent(precio) +
      "&imagen=" + encodeURIComponent(imagen);

    card.classList.add("reveal");
    card.style.setProperty("--d", (i % 4) * 0.08 + "s");
    card.innerHTML = `
      <div class="product-image">
        <img src="${encodeURI(imagen)}" alt="" loading="lazy">
        ${nuevo === "true" ? '<span class="badge">Nuevo</span>' : ""}
      </div>
      <div class="product-info">
        <div class="product-name"></div>
        <div class="product-price">${formatoPrecio(precio)}</div>
        <div class="card-actions">
          <a class="order-btn" href="${enlacePedido}">Pedir ahora</a>
          <button type="button" class="add-btn">+ Carrito</button>
        </div>
      </div>`;
    card.querySelector(".product-name").textContent = nombre;
    card.querySelector("img").alt = nombre;
    card.querySelector(".add-btn").addEventListener("click", () => {
      agregarAlCarrito({ nombre, precio: Number(precio), imagen });
      volarAlCarrito(card.querySelector(".product-image img"));
      mostrarAviso(nombre + " agregado al carrito");
    });
  });

  // Filtros y búsqueda
  let filtroActual = "todo";
  const buscador = document.getElementById("searchInput");

  function aplicarFiltros() {
    const texto = buscador.value.trim().toLowerCase();
    let visibles = 0;
    tarjetas.forEach((card) => {
      const coincideFiltro = filtroActual === "todo" || card.dataset.nuevo === "true";
      const coincideTexto = card.dataset.nombre.toLowerCase().includes(texto);
      const mostrar = coincideFiltro && coincideTexto;
      card.classList.toggle("hidden", !mostrar);
      if (mostrar) visibles++;
    });
    document.getElementById("emptyMsg").classList.toggle("visible", visibles === 0);
  }

  function elegirFiltro(filtro) {
    filtroActual = filtro;
    document.querySelectorAll(".filter-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.filter === filtro);
    });
    aplicarFiltros();
  }

  document.querySelectorAll(".filter-btn").forEach((b) => {
    b.addEventListener("click", () => elegirFiltro(b.dataset.filter));
  });

  document.querySelectorAll("[data-filter-link]").forEach((a) => {
    a.addEventListener("click", () => {
      elegirFiltro(a.dataset.filterLink);
      document.getElementById("mainNav").classList.remove("open");
    });
  });

  // Baja a la colección solo al empezar a escribir, no en cada letra
  let yaBajo = false;
  buscador.addEventListener("input", () => {
    if (buscador.value && !yaBajo) {
      document.getElementById("coleccion").scrollIntoView({ behavior: "smooth" });
      yaBajo = true;
    }
    if (!buscador.value) yaBajo = false;
    aplicarFiltros();
  });

  document.getElementById("searchToggle").addEventListener("click", () => {
    const barra = document.getElementById("searchBar");
    barra.classList.toggle("open");
    if (barra.classList.contains("open")) buscador.focus();
  });

  document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("mainNav").classList.toggle("open");
  });
}

// ---- Cajón del carrito ----
function iniciarCajon() {
  const cajon = document.getElementById("cartDrawer");
  if (!cajon) return;
  const fondo = document.getElementById("cartOverlay");

  // "inert" evita que el teclado entre al carrito cuando está cerrado
  cajon.inert = true;
  const abrir = () => {
    cajon.classList.add("open");
    fondo.classList.add("open");
    cajon.inert = false;
    document.getElementById("cartClose").focus();
  };
  const cerrar = () => {
    if (!cajon.classList.contains("open")) return;
    cajon.classList.remove("open");
    fondo.classList.remove("open");
    cajon.inert = true;
  };

  document.querySelectorAll(".js-open-cart").forEach((b) => b.addEventListener("click", abrir));
  document.getElementById("cartClose").addEventListener("click", cerrar);
  fondo.addEventListener("click", cerrar);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrar();
  });

  document.getElementById("checkoutBtn").addEventListener("click", () => {
    window.location.href = "pedido.html?carrito=1";
  });

  // Los enlaces "Carrito" de otras páginas llegan con #carrito
  if (location.hash === "#carrito") {
    history.replaceState(null, "", location.pathname);
    abrir();
  }
}

let temporizadorAviso;
function mostrarAviso(texto) {
  const aviso = document.getElementById("toast");
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.classList.add("show");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove("show"), 1800);
}

// ---- Efectos ----
const menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function iniciarEfectos() {
  // Barra superior con sombra al hacer scroll
  const header = document.querySelector(".site-header");
  const alScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", alScroll, { passive: true });
  alScroll();

  // Título de la portada: cada palabra entra por separado
  const titulo = document.querySelector(".hero-copy h1");
  if (titulo && !menosMovimiento) {
    let i = 0;
    const partir = (texto, esDestacado) =>
      texto.split(/(\s+)/).map((trozo) => {
        if (!trozo.trim()) return document.createTextNode(trozo);
        const span = document.createElement("span");
        span.className = esDestacado ? "word hl" : "word";
        span.style.setProperty("--i", i++);
        span.textContent = trozo;
        return span;
      });
    [...titulo.childNodes].forEach((nodo) => {
      const esDestacado = nodo.nodeType === 1 && nodo.classList.contains("hl");
      titulo.replaceChild(wrap(partir(nodo.textContent, esDestacado)), nodo);
    });
    function wrap(nodos) {
      const frag = document.createDocumentFragment();
      nodos.forEach((n) => frag.appendChild(n));
      return frag;
    }
  }

  // Elementos que aparecen al hacer scroll
  document
    .querySelectorAll(".section-head, .filters, .social-card, .form-card, .info-card, .contact-hero > *")
    .forEach((el, i) => {
      el.classList.add("reveal");
      if (el.classList.contains("social-card")) el.style.setProperty("--d", (i % 4) * 0.1 + "s");
    });

  const reveles = document.querySelectorAll(".reveal");
  if (menosMovimiento || !("IntersectionObserver" in window)) {
    reveles.forEach((el) => el.classList.add("visible"));
  } else {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observador.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveles.forEach((el) => observador.observe(el));
  }

  // Tarjetas de producto que se inclinan siguiendo el mouse
  if (!menosMovimiento && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", (x - 0.5) * 10 + "deg");
        card.style.setProperty("--rx", (0.5 - y) * 10 + "deg");
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
      });
      card.addEventListener("mouseleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }
}

// La foto del producto vuela hasta el ícono del carrito
function volarAlCarrito(img) {
  const destino = [...document.querySelectorAll(".js-open-cart")].find((b) => b.offsetParent !== null);
  if (!img || !destino || menosMovimiento) return;
  const a = img.getBoundingClientRect();
  const b = destino.getBoundingClientRect();
  const clon = img.cloneNode();
  clon.className = "fly-img";
  Object.assign(clon.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
  document.body.appendChild(clon);
  clon.getBoundingClientRect(); // fija la posición inicial antes de animar
  requestAnimationFrame(() => {
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    clon.style.transform = `translate(${dx}px, ${dy}px) scale(0.08) rotate(20deg)`;
    clon.style.opacity = "0.4";
  });
  clon.addEventListener("transitionend", () => clon.remove(), { once: true });
  setTimeout(() => clon.remove(), 1200);
}

function rebotarContador() {
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  });
}

iniciarCatalogo();
iniciarCajon();
iniciarEfectos();
pintarCarrito();
