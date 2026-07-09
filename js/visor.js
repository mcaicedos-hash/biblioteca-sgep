/* VISOR · Lee el JSON del libro indicado en la URL (?libro=id).
   El libro ocupa toda la pantalla y se auto-ajusta a cualquier tamaño.

   Incluye:
   - Carga progresiva y reintentos si Drive falla
   - Pasar página: swipe táctil, arrastre de esquina, flechas, teclado
   - Pantalla completa real, con modo alternativo para iPhone
   - ZOOM DE LECTURA: doble toque sobre la página (o botón de lupa)
     abre la página en una capa donde se puede pellizcar para acercar
     y arrastrar para moverse, sin alterar el zoom del resto del sitio */

const URL_PAGINA = (driveId) =>
  `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;

// Para el zoom pedimos más resolución, así el texto se lee nítido de cerca
const URL_ZOOM = (driveId) =>
  `https://drive.google.com/thumbnail?id=${driveId}&sz=w2400`;

const VENTANA_ATRAS = 2;
const VENTANA_ADELANTE = 5;

let pageFlip = null;
let imagenes = [];
let paginasIds = [];   // driveIds en orden
let totalPaginas = 0;

async function iniciarVisor() {
  const params = new URLSearchParams(location.search);
  const libroId = params.get("libro");
  const titulo = document.getElementById("tituloLibro");

  if (!libroId) {
    titulo.textContent = "No se indicó ningún libro.";
    return;
  }

  let libro;
  try {
    libro = await (await fetch(`data/${libroId}.json`)).json();
  } catch (e) {
    titulo.textContent = "No fue posible cargar este libro.";
    console.error(e);
    return;
  }

  titulo.textContent = libro.titulo;
  document.title = `${libro.titulo} — Biblioteca de Manuales`;

  if (window.goatcounter && window.goatcounter.count) {
    window.goatcounter.count({
      path: `libro-${libro.id}`,
      title: `Apertura: ${libro.titulo}`,
      event: true,
    });
  }

  construirFlipbook(libro);
  prepararZoom();
}

function construirFlipbook(libro) {
  const contenedor = document.getElementById("flipbook");
  paginasIds = libro.paginas;
  totalPaginas = paginasIds.length;

  libro.paginas.forEach((driveId, i) => {
    const pagina = document.createElement("div");
    pagina.className = "pagina";
    pagina.dataset.density = i === 0 || i === totalPaginas - 1 ? "hard" : "soft";

    const img = document.createElement("img");
    img.dataset.src = URL_PAGINA(driveId);
    img.alt = `Página ${i + 1}`;
    img.draggable = false;

    const marcador = document.createElement("div");
    marcador.className = "marcador";
    marcador.innerHTML = `<div class="spinner"></div><span>Página ${i + 1}</span>`;

    const btn = document.createElement("button");
    btn.className = "btn-reintentar";
    btn.textContent = "Reintentar";
    btn.addEventListener("pointerdown", (e) => e.stopPropagation());
    btn.addEventListener("touchstart", (e) => e.stopPropagation());
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      pagina.classList.remove("con-error");
      cargarImagen(i, false);
    });
    marcador.appendChild(btn);

    pagina.appendChild(img);
    pagina.appendChild(marcador);
    contenedor.appendChild(pagina);
    imagenes.push(img);
  });

  const prop = libro.proporcion || { ancho: 2550, alto: 3300 };
  const anchoBase = 500;
  const altoBase = Math.round((anchoBase * prop.alto) / prop.ancho);

  pageFlip = new St.PageFlip(contenedor, {
    width: anchoBase,
    height: altoBase,
    size: "stretch",
    minWidth: 300,
    maxWidth: 1100,
    minHeight: 320,
    maxHeight: 1500,
    usePortrait: true,
    showCover: true,
    maxShadowOpacity: 0.45,
    swipeDistance: 12,
    mobileScrollSupport: false,
    // El clic simple ya NO pasa página: así el doble toque queda
    // reservado para el zoom. Se pasa con swipe, esquinas o flechas.
    disableFlipByClick: true,
  });

  pageFlip.loadFromHTML(document.querySelectorAll(".pagina"));

  cargarVentana(0);
  actualizarControles(0);

  pageFlip.on("flip", (e) => {
    cargarVentana(e.data);
    actualizarControles(e.data);
  });

  window.addEventListener("resize", () => {
    setTimeout(
      () => actualizarControles(pageFlip.getCurrentPageIndex()),
      300
    );
  });

  conectarControles();
}

/* ---------- Carga progresiva ---------- */

function cargarVentana(indiceActual) {
  const desde = Math.max(0, indiceActual - VENTANA_ATRAS);
  const hasta = Math.min(imagenes.length - 1, indiceActual + VENTANA_ADELANTE);
  for (let i = desde; i <= hasta; i++) cargarImagen(i, false);
}

function cargarImagen(i, esReintento) {
  const img = imagenes[i];
  if (!img) return;
  const estado = img.dataset.estado;
  if (estado === "ok" || estado === "cargando") return;

  img.dataset.estado = "cargando";
  const pagina = img.closest(".pagina");

  img.onload = () => {
    img.dataset.estado = "ok";
    pagina.classList.add("cargada");
    pagina.classList.remove("con-error");
  };

  img.onerror = () => {
    if (!esReintento) {
      img.dataset.estado = "";
      setTimeout(() => cargarImagen(i, true), 1000);
    } else {
      img.dataset.estado = "";
      pagina.classList.add("con-error");
    }
  };

  img.src = img.dataset.src + (esReintento ? "&reintento=" + Date.now() : "");
}

/* ---------- Controles del visor ---------- */

function actualizarControles(indice) {
  const pill = document.getElementById("pillPagina");
  if (!pill.querySelector("input")) {
    pill.textContent = `Pág. ${indice + 1} de ${totalPaginas}`;
  }
  document.getElementById("btnAnterior").disabled = indice === 0;
  document.getElementById("btnSiguiente").disabled = indice >= totalPaginas - 1;
}

function conectarControles() {
  const btnAnterior = document.getElementById("btnAnterior");
  const btnSiguiente = document.getElementById("btnSiguiente");
  const btnPantalla = document.getElementById("btnPantalla");
  const pill = document.getElementById("pillPagina");

  btnAnterior.addEventListener("click", () => pageFlip.flipPrev());
  btnSiguiente.addEventListener("click", () => pageFlip.flipNext());

  document.addEventListener("keydown", (e) => {
    if (zoomAbierto()) {
      if (e.key === "ArrowLeft") zoomIrA(indiceZoom - 1);
      if (e.key === "ArrowRight") zoomIrA(indiceZoom + 1);
      if (e.key === "Escape") cerrarZoom();
      return;
    }
    if (e.key === "ArrowLeft") pageFlip.flipPrev();
    if (e.key === "ArrowRight") pageFlip.flipNext();
  });

  btnPantalla.addEventListener("click", async () => {
    const doc = document;
    const raiz = doc.documentElement;
    const activa = doc.fullscreenElement || doc.webkitFullscreenElement;

    if (activa) {
      (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
      return;
    }

    const pedir = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
    if (pedir) {
      try {
        await pedir.call(raiz);
        return;
      } catch (e) { /* sigue al modo alternativo */ }
    }
    document.body.classList.toggle("modo-inmersivo");
  });

  pill.addEventListener("click", () => {
    if (pill.querySelector("input")) return;
    const actual = pageFlip.getCurrentPageIndex() + 1;
    pill.innerHTML = `Ir a pág. <input type="number" inputmode="numeric" min="1" max="${totalPaginas}" value="${actual}">`;
    const input = pill.querySelector("input");
    input.focus();
    input.select();

    const cerrar = () => {
      const idx = pageFlip.getCurrentPageIndex();
      pill.innerHTML = "";
      pill.textContent = `Pág. ${idx + 1} de ${totalPaginas}`;
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const n = parseInt(input.value, 10);
        if (n >= 1 && n <= totalPaginas) {
          cargarVentana(n - 1);
          pageFlip.turnToPage(n - 1);
          actualizarControles(n - 1);
        }
        cerrar();
      }
      if (e.key === "Escape") cerrar();
    });
    input.addEventListener("blur", () => setTimeout(cerrar, 150));
  });
}

/* ==================================================================
   ZOOM DE LECTURA
   Doble toque / doble clic sobre la página (o botón de lupa) abre
   la página actual en una capa propia con pellizco, arrastre y rueda.
   El zoom vive SOLO dentro de esa capa: no altera el resto del sitio.
   ================================================================== */

let indiceZoom = 0;
let escala = 1, tx = 0, ty = 0;      // transformación actual de la imagen
const ESCALA_MAX = 5;
const punteros = new Map();           // dedos/punteros activos
let gesto = null;                     // datos del gesto en curso
let ultimoTap = { t: 0, x: 0, y: 0 };

const capa = () => document.getElementById("capaZoom");
const imgZoom = () => document.getElementById("imgZoom");
const zoomAbierto = () => !capa().classList.contains("oculta");

function prepararZoom() {
  const zona = document.getElementById("zonaLibro");

  // Doble toque / doble clic sobre el libro → abrir zoom
  zona.addEventListener("pointerdown", (e) => {
    const ahora = Date.now();
    const esDoble =
      ahora - ultimoTap.t < 350 &&
      Math.abs(e.clientX - ultimoTap.x) < 40 &&
      Math.abs(e.clientY - ultimoTap.y) < 40;
    ultimoTap = { t: ahora, x: e.clientX, y: e.clientY };
    if (esDoble) abrirZoom(paginaTocada(e.clientX));
  });

  document.getElementById("btnLupa").addEventListener("click", () =>
    abrirZoom(pageFlip.getCurrentPageIndex())
  );
  document.getElementById("btnCerrarZoom").addEventListener("click", cerrarZoom);
  document.getElementById("btnZoomAnterior").addEventListener("click", () =>
    zoomIrA(indiceZoom - 1)
  );
  document.getElementById("btnZoomSiguiente").addEventListener("click", () =>
    zoomIrA(indiceZoom + 1)
  );

  conectarGestosZoom();
}

// En vista de doble página, decide qué página tocó el usuario
// (mitad izquierda o derecha del libro)
function paginaTocada(clientX) {
  const i = pageFlip.getCurrentPageIndex();
  if (pageFlip.getOrientation() !== "landscape") return i;

  // Con portada: los pliegos son (1,2), (3,4)... la izquierda es impar
  let izq = i % 2 === 1 ? i : i - 1;
  if (izq < 1) return 0;                       // portada sola
  let der = izq + 1;
  if (der >= totalPaginas) return izq;         // contraportada sola

  const rect = document.getElementById("flipbook").getBoundingClientRect();
  const centro = rect.left + rect.width / 2;
  return clientX > centro ? der : izq;
}

function abrirZoom(indice) {
  indiceZoom = Math.max(0, Math.min(totalPaginas - 1, indice));
  capa().classList.remove("oculta");
  document.getElementById("ayudaZoom").classList.remove("desvanecida");
  setTimeout(
    () => document.getElementById("ayudaZoom").classList.add("desvanecida"),
    3500
  );
  cargarPaginaZoom();
}

function cerrarZoom() {
  capa().classList.add("oculta");
  // Sincroniza el libro con la página donde quedó la lectura en zoom
  if (indiceZoom !== pageFlip.getCurrentPageIndex()) {
    cargarVentana(indiceZoom);
    pageFlip.turnToPage(indiceZoom);
    actualizarControles(indiceZoom);
  }
}

function zoomIrA(indice) {
  if (indice < 0 || indice >= totalPaginas) return;
  indiceZoom = indice;
  cargarPaginaZoom();
}

function cargarPaginaZoom() {
  const img = imgZoom();
  reiniciarTransform();
  img.classList.remove("lista");
  img.src = URL_ZOOM(paginasIds[indiceZoom]);
  img.onload = () => img.classList.add("lista");
  img.onerror = () => {
    // Si la versión grande falla, usamos la normal (probablemente en caché)
    img.src = URL_PAGINA(paginasIds[indiceZoom]);
  };
  document.getElementById("pillZoom").textContent =
    `Pág. ${indiceZoom + 1} de ${totalPaginas}`;
  document.getElementById("btnZoomAnterior").disabled = indiceZoom === 0;
  document.getElementById("btnZoomSiguiente").disabled =
    indiceZoom >= totalPaginas - 1;
}

/* --- Gestos dentro de la capa de zoom --- */

function conectarGestosZoom() {
  const c = capa();
  const img = imgZoom();

  c.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;   // los botones no inician gestos
    c.setPointerCapture(e.pointerId);
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (punteros.size === 1) {
      // Posible arrastre o doble toque
      const ahora = Date.now();
      const esDoble =
        ahora - ultimoTap.t < 350 &&
        Math.abs(e.clientX - ultimoTap.x) < 40 &&
        Math.abs(e.clientY - ultimoTap.y) < 40;
      ultimoTap = { t: ahora, x: e.clientX, y: e.clientY };

      if (esDoble) {
        alternarZoomEn(e.clientX, e.clientY);
        gesto = null;
        return;
      }
      gesto = { tipo: "pan", x0: e.clientX, y0: e.clientY, tx0: tx, ty0: ty };
    } else if (punteros.size === 2) {
      // Pellizco
      const [a, b] = [...punteros.values()];
      gesto = {
        tipo: "pellizco",
        dist0: Math.hypot(a.x - b.x, a.y - b.y),
        escala0: escala,
        medio0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        tx0: tx,
        ty0: ty,
      };
    }
  });

  c.addEventListener("pointermove", (e) => {
    if (!punteros.has(e.pointerId)) return;
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!gesto) return;

    if (gesto.tipo === "pan" && punteros.size === 1 && escala > 1) {
      tx = gesto.tx0 + (e.clientX - gesto.x0);
      ty = gesto.ty0 + (e.clientY - gesto.y0);
      aplicarTransform();
    }

    if (gesto.tipo === "pellizco" && punteros.size === 2) {
      const [a, b] = [...punteros.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const medio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const nueva = limitar(gesto.escala0 * (dist / gesto.dist0), 1, ESCALA_MAX);

      // Mantiene el punto pellizcado bajo los dedos mientras escala
      const f = nueva / gesto.escala0;
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      tx = (gesto.medio0.x - cx) - f * (gesto.medio0.x - cx - gesto.tx0)
           + (medio.x - gesto.medio0.x);
      ty = (gesto.medio0.y - cy) - f * (gesto.medio0.y - cy - gesto.ty0)
           + (medio.y - gesto.medio0.y);
      escala = nueva;
      if (escala === 1) { tx = 0; ty = 0; }
      aplicarTransform();
    }
  });

  const soltar = (e) => {
    punteros.delete(e.pointerId);
    if (punteros.size < 2 && gesto && gesto.tipo === "pellizco") gesto = null;
    if (punteros.size === 0) gesto = null;
  };
  c.addEventListener("pointerup", soltar);
  c.addEventListener("pointercancel", soltar);

  // Rueda del mouse (PC): acerca/aleja centrado en el cursor
  c.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const nueva = limitar(escala * factor, 1, ESCALA_MAX);
      const f = nueva / escala;
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      tx = (e.clientX - cx) - f * (e.clientX - cx - tx);
      ty = (e.clientY - cy) - f * (e.clientY - cy - ty);
      escala = nueva;
      if (escala === 1) { tx = 0; ty = 0; }
      aplicarTransform();
    },
    { passive: false }
  );

  img.addEventListener("dblclick", (e) => e.preventDefault());
}

// Doble toque dentro del zoom: alterna entre ajuste (1x) y 2.5x
function alternarZoomEn(x, y) {
  if (escala > 1) {
    reiniciarTransform();
    return;
  }
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  escala = 2.5;
  tx = (x - cx) * (1 - escala);
  ty = (y - cy) * (1 - escala);
  aplicarTransform();
}

function limitar(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function reiniciarTransform() {
  escala = 1; tx = 0; ty = 0;
  aplicarTransform();
}

function aplicarTransform() {
  imgZoom().style.transform =
    `translate(${tx}px, ${ty}px) scale(${escala})`;
}

iniciarVisor();
