# 📚 Biblioteca de Manuales — SGEP

Sitio web estático que muestra tus manuales como **revistas digitales con efecto de pasar página** (estilo Issuu). Las imágenes viven en Google Drive y el sitio se publica gratis en GitHub Pages.

Esta guía te lleva de cero a tener el sitio funcionando, **sin saber programar**. Sigue los pasos en orden.

---

## ¿Qué hay en esta carpeta?

| Archivo / carpeta | Qué es | ¿Lo tocas? |
|---|---|---|
| `index.html` | La página de inicio (el librero con las portadas) | No |
| `visor.html` | El visor tipo revista | No |
| `css/estilos.css` | Los colores y tipografía (kit RenoBo) | Solo si cambias el color de acento |
| `js/` | La lógica del sitio | No |
| `libs/` | La librería del efecto de página | No |
| `data/libros.json` | **La lista de libros de la biblioteca** | Sí, cuando agregues libros |
| `data/ficha-proyectos.json` | Las páginas del libro "Ficha de Proyectos" (ya listo) | No |
| `data/pagos.json` | Las páginas del libro "Pagos" (ya listo) | No |
| `herramientas/generar-catalogo.txt` | Script para agregar libros nuevos sin copiar IDs a mano | Cuando agregues libros |

> Los dos libros actuales **ya están configurados** con los IDs reales de tus carpetas de Drive. No tienes que hacer nada con ellos.

---

## PARTE 1 · Publicar el sitio (se hace una sola vez, ~15 min)

### Paso 1. Verifica que tus carpetas de Drive sean públicas

1. Entra a [drive.google.com](https://drive.google.com).
2. Haz **clic derecho** sobre la carpeta del libro (ej. la de "Ficha de proyectos") → **Compartir** → **Compartir**.
3. En la parte de abajo, donde dice "Acceso general", debe decir:
   **"Cualquier persona con el enlace"** con rol **"Lector"**.
4. Si dice "Restringido", cámbialo a "Cualquier persona con el enlace" y clic en **Listo**.
5. Repite con la carpeta del otro libro.

⚠️ Si la carpeta no es pública, las páginas del libro saldrán en gris en el sitio.

### Paso 2. Crea el repositorio en GitHub

1. Entra a [github.com](https://github.com) con tu cuenta (`mcaicedos-hash`).
2. Arriba a la derecha, clic en el **+** → **New repository**.
3. En **Repository name** escribe: `biblioteca-sgep` (así, en minúsculas).
4. Marca la opción **Public** (obligatorio para GitHub Pages gratis).
5. NO marques ninguna otra casilla. Clic en **Create repository**.

### Paso 3. Sube los archivos

1. En la página del repositorio recién creado, clic en el enlace **"uploading an existing file"** (está en el texto del centro).
2. Abre en tu computador la carpeta `biblioteca-sgep` que te entregué (descomprime el ZIP primero).
3. **Selecciona TODO lo que hay DENTRO de la carpeta** (los archivos `index.html`, `visor.html`, `README.md` y las carpetas `css`, `js`, `libs`, `data`, `herramientas`) y **arrástralos** a la ventana de GitHub.
   - 💡 Arrastra el *contenido* de la carpeta, no la carpeta misma, para que `index.html` quede en la raíz del repositorio.
4. Espera a que carguen todos (verás la lista completa).
5. Abajo, en el campo del mensaje, escribe algo como `Primera versión` y clic en **Commit changes**.

### Paso 4. Activa GitHub Pages

1. En tu repositorio, clic en la pestaña **Settings** (arriba a la derecha).
2. En el menú de la izquierda, clic en **Pages**.
3. En **Source**, elige **Deploy from a branch**.
4. En **Branch**, elige **main** y la carpeta **/ (root)**. Clic en **Save**.
5. Espera 1 a 3 minutos y recarga la página: arriba aparecerá tu dirección:

   **https://mcaicedos-hash.github.io/biblioteca-sgep/**

### Paso 5. ¡Pruébalo!

Abre esa dirección. Deberías ver el librero con los dos manuales. Haz clic en uno y pasa las páginas arrastrando las esquinas, con las flechas, o con las teclas ← → del teclado. Pruébalo también desde el celular.

> La **primera vez** que se abre cada página puede tardar 1–2 segundos (Google está generando la imagen). Las siguientes veces carga rápido porque queda en caché.

---

## PARTE 2 · Activar el contador de visitas (opcional, ~5 min)

Esto te dice **cuántas veces se abre cada libro**. Es gratis y no usa cookies.

1. Entra a [goatcounter.com](https://www.goatcounter.com) → **Sign up**.
2. En **Code** escribe por ejemplo `biblioteca-sgep` (esa palabra será tu código).
3. Completa el registro. Tu panel quedará en `https://biblioteca-sgep.goatcounter.com`.
4. En GitHub, abre el archivo `index.html` de tu repositorio → clic en el **lápiz** (Edit) → busca donde dice `TU-CODIGO` y reemplázalo por tu código (ej. `biblioteca-sgep`) → **Commit changes**.
5. Repite lo mismo en `visor.html`.
6. Listo. En tu panel de GoatCounter, cada apertura de libro aparece como un evento llamado `libro-ficha-proyectos`, `libro-pagos`, etc.

Si no quieres analítica, simplemente no hagas nada: el sitio funciona igual.

---

## PARTE 3 · Agregar un libro nuevo (cada vez que lo necesites, ~10 min)

### Paso 1. Sube las imágenes a Drive

1. Crea una carpeta nueva en tu Drive (una carpeta por libro).
2. Sube los JPG/PNG de las páginas, **nombrados en orden**: `MiLibro_01.jpg`, `MiLibro_02.jpg`… (usa siempre dos dígitos: 01, 02… no 1, 2).
3. Haz la carpeta **pública**: clic derecho → Compartir → "Cualquier persona con el enlace" → Lector.

### Paso 2. Genera el JSON del libro automáticamente

1. Abre el archivo `herramientas/generar-catalogo.txt` de esta carpeta y sigue las instrucciones que están al inicio (pegar el script en [script.google.com](https://script.google.com), poner el ID de la carpeta, ejecutar).
2. El script te muestra el JSON completo del libro. Cópialo.

### Paso 3. Súbelo al repositorio

1. En GitHub, entra a la carpeta `data/` de tu repositorio.
2. Clic en **Add file** → **Create new file**.
3. Nómbralo igual que el `id` que pusiste en el script, con extensión `.json`. Ejemplo: `induccion.json`.
4. Pega el JSON que copiaste y clic en **Commit changes**.

### Paso 4. Agrégalo a la lista de libros

1. En `data/`, abre `libros.json` → clic en el **lápiz** (Edit).
2. Dentro de la lista `"libros": [ ... ]`, agrega una **coma** después del último libro y pega un bloque nuevo:

```json
    {
      "id": "induccion",
      "titulo": "Manual de Inducción",
      "descripcion": "Descripción corta que aparece en la tarjeta",
      "categoria": "Manual",
      "archivo": "data/induccion.json"
    }
```

3. El `id` y el `archivo` deben coincidir exactamente con el archivo que creaste en el paso anterior.
4. **Commit changes**. En 1–2 minutos el libro nuevo aparece en el sitio. Eso es todo. 🎉

---

## Extras

### Cambiar el color de acento del sitio

Abre `css/estilos.css` (con el lápiz en GitHub) y edita **solo estas dos líneas** al inicio:

```css
--acento: #AFE951;              /* nuevo color de la paleta RenoBo */
--texto-sobre-acento: #434343;  /* #434343 si el acento es claro, #FFFFFF si es oscuro */
```

La paleta completa está comentada justo debajo en el mismo archivo.

### Problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| El sitio da error 404 | Pages aún no termina de publicar, o `index.html` no quedó en la raíz | Espera 3 min. Verifica que `index.html` esté en el primer nivel del repo, no dentro de una subcarpeta |
| Una página sale gris con "Reintentar" | La carpeta de Drive no es pública, o Drive tuvo un fallo momentáneo | Verifica el Paso 1 de la Parte 1; luego clic en "Reintentar" |
| El libro nuevo no aparece en el home | Error de tipeo en `libros.json` (una coma de más o de menos rompe el JSON) | Valida el archivo pegándolo en [jsonlint.com](https://jsonlint.com) |
| Las páginas salen en otro orden | Los archivos en Drive no tienen dos dígitos (`pag1` vs `pag10`) | Renombra en Drive con dos dígitos y vuelve a generar el JSON |
| Cambié algo y no se ve | Caché del navegador | Recarga con Ctrl+Shift+R (o borra caché en el celular) |

### Reglas de oro

- **No muevas ni borres** las imágenes de las carpetas de Drive ya publicadas: cada archivo tiene un ID único y si desaparece, esa página queda rota en el sitio.
- Para reemplazar una página con una versión corregida: en Drive, clic derecho sobre el archivo → **Administrar versiones** → **Subir versión nueva**. Así el ID se conserva y no hay que tocar nada en GitHub.
