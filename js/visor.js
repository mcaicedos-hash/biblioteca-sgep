/* VISOR · Lee el JSON del libro indicado en la URL (?libro=id).
   El libro ocupa toda la pantalla y se auto-ajusta a cualquier
   tamaño (celular, tablet, PC, pantalla completa). Los controles
   flotan encima y están siempre visibles.

   Incluye:
   - Carga progresiva (solo las páginas cercanas a la actual)
   - Reintento automático si Drive falla, y botón "Reintentar"
   - Pasar página con: swipe/arrastre táctil, arrastre de esquina
     con mouse, clic/tap en los bordes, flechas flotantes y teclado
   - Pantalla completa real, con modo alternativo para iPhone */

const URL_PAGINA = (driveId) =>
  `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;

const VENTANA_ATRAS = 2;     // páginas hacia atrás que se mantienen cargadas
const VENTANA_ADELANTE = 5;  // páginas hacia adelante que se precargan

let pageFlip = null;
let imagenes = [];           // referencia a cada <img> por índice de página

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

  // Analítica: registra una apertura de este libro (si GoatCounter está activo)
  if (window.goatcounter && window.goatcounter.count) {
    window.goatcounter.count({
      path: `libro-${libro.id}`,
      title: `Apertura: ${libro.titulo}`,
      event: true,
    });
  }

  construirFlipbook(libro);
}

function construirFlipbook(libro) {
  const contenedor = document.getElementById("flipbook");
  const total = libro.paginas.length;

  // Un div por página. La imagen empieza SIN src: se asigna solo
  // cuando la página está cerca de la vista actual (carga progresiva).
  libro.paginas.forEach((driveId, i) => {
    const pagina = document.createElement("div");
    pagina.className = "pagina";
    // Portada y contraportada como tapas duras (van solas, giran planas)
    pagina.dataset.density = i === 0 || i === total - 1 ? "hard" : "soft";

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

  // Proporción de la página (tamaño carta por defecto)
  const prop = libro.proporcion || { ancho: 2550, alto: 3300 };
  const anchoBase = 500;
  const altoBase = Math.round((anchoBase * prop.alto) / prop.ancho);

  pageFlip = new St.PageFlip(contenedor, {
    width: anchoBase,
    height: altoBase,
    size: "stretch",          // se estira para llenar el espacio disponible
    minWidth: 300,            // por debajo de ~600px de ancho pasa a 1 página
    maxWidth: 1100,
    minHeight: 320,
    maxHeight: 1500,
    usePortrait: true,        // en celular vertical: una página a la vez
    showCover: true,          // portada y contraportada van solas
    maxShadowOpacity: 0.45,
    swipeDistance: 12,        // swipe táctil más sensible
    mobileScrollSupport: false,
  });

  pageFlip.loadFromHTML(document.querySelectorAll(".pagina"));

  // Carga inicial y estado de controles
  cargarVentana(0);
  actualizarControles(0, total);

  pageFlip.on("flip", (e) => {
    cargarVentana(e.data);
    actualizarControles(e.data, total);
  });

  // Al girar el celular o entrar/salir de pantalla completa,
  // la librería ya se re-ajusta sola con el evento resize del navegador.
  // Solo refrescamos el estado de los botones por si cambió la orientación.
  window.addEventListener("resize", () => {
    setTimeout(
      () => actualizarControles(pageFlip.getCurrentPageIndex(), total),
      300
    );
  });

  conectarControles(total);
}

/* ---------- Carga progresiva de imágenes ---------- */

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
      // Primer fallo: reintento automático y silencioso tras 1 segundo
      img.dataset.estado = "";
      setTimeout(() => cargarImagen(i, true), 1000);
    } else {
      // Segundo fallo: se muestra el botón "Reintentar"
      img.dataset.estado = "";
      pagina.classList.add("con-error");
    }
  };

  // El parámetro extra evita que un error quede guardado en caché
  img.src = img.dataset.src + (esReintento ? "&reintento=" + Date.now() : "");
}

/* ---------- Controles ---------- */

function actualizarControles(indice, total) {
  const pill = document.getElementById("pillPagina");
  if (!pill.querySelector("input")) {
    pill.textContent = `Pág. ${indice + 1} de ${total}`;
  }
  document.getElementById("btnAnterior").disabled = indice === 0;
  document.getElementById("btnSiguiente").disabled = indice >= total - 1;
}

function conectarControles(total) {
  const btnAnterior = document.getElementById("btnAnterior");
  const btnSiguiente = document.getElementById("btnSiguiente");
  const btnPantalla = document.getElementById("btnPantalla");
  const pill = document.getElementById("pillPagina");

  btnAnterior.addEventListener("click", () => pageFlip.flipPrev());
  btnSiguiente.addEventListener("click", () => pageFlip.flipNext());

  // Flechas del teclado (en computador)
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") pageFlip.flipPrev();
    if (e.key === "ArrowRight") pageFlip.flipNext();
  });

  // Pantalla completa con respaldo para iPhone (Safari en iPhone
  // no permite pantalla completa real: usamos un modo inmersivo
  // que oculta la barra superior del visor).
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

  // Ir a una página específica: tocar el pill → escribir número → Enter
  pill.addEventListener("click", () => {
    if (pill.querySelector("input")) return;
    const actual = pageFlip.getCurrentPageIndex() + 1;
    pill.innerHTML = `Ir a pág. <input type="number" inputmode="numeric" min="1" max="${total}" value="${actual}">`;
    const input = pill.querySelector("input");
    input.focus();
    input.select();

    const cerrar = () => {
      const idx = pageFlip.getCurrentPageIndex();
      pill.innerHTML = "";
      pill.textContent = `Pág. ${idx + 1} de ${total}`;
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const n = parseInt(input.value, 10);
        if (n >= 1 && n <= total) {
          cargarVentana(n - 1);           // asegura que la página esté cargada
          pageFlip.turnToPage(n - 1);     // salto directo, sin animar todo el camino
          actualizarControles(n - 1, total);
        }
        cerrar();
      }
      if (e.key === "Escape") cerrar();
    });
    input.addEventListener("blur", () => setTimeout(cerrar, 150));
  });
}

iniciarVisor();
