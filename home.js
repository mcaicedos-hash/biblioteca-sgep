/* HOME · Lee data/libros.json y pinta una tarjeta por libro.
   La portada de cada libro es su página 1, servida desde Google Drive
   en baja resolución (w400) para que cargue rápido. */

const URL_PORTADA = (driveId) =>
  `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;

async function iniciarHome() {
  const librero = document.getElementById("librero");

  try {
    const catalogo = await (await fetch("data/libros.json")).json();

    for (const libro of catalogo.libros) {
      // Leemos el JSON del libro para conocer su primera página (portada)
      // y su número total de páginas.
      const detalle = await (await fetch(libro.archivo)).json();

      const tarjeta = document.createElement("a");
      tarjeta.className = "tarjeta";
      tarjeta.href = `visor.html?libro=${encodeURIComponent(libro.id)}`;

      tarjeta.innerHTML = `
        <div class="portada">
          <div class="libro3d">
            <img loading="lazy" alt="Portada de ${libro.titulo}"
                 src="${URL_PORTADA(detalle.paginas[0])}">
          </div>
        </div>
        <div class="info">
          <span class="pill-categoria">${libro.categoria || "Manual"}</span>
          <h2>${libro.titulo}</h2>
          <p class="descripcion">${libro.descripcion || ""}</p>
          <p class="paginas-num">${detalle.paginas.length} páginas</p>
        </div>`;

      librero.appendChild(tarjeta);
    }
  } catch (e) {
    librero.innerHTML =
      '<p class="aviso-error">No fue posible cargar el catálogo. ' +
      "Verifica que los archivos de la carpeta data/ estén en el repositorio.</p>";
    console.error(e);
  }
}

iniciarHome();
