# Ornamentos

**Capitulares y florones de libros antiguos, en SVG y listos para la web.**

Cinco alfabetos ornamentados, del siglo XI al XIX, sacados del *Alphabet-album* de Joseph-Balthazar Silvestre (París, 1843), y 23 florones de torno fotografiados por Edward J. Woolsey en 1869. Cada letra está recortada y vectorizada; cada florón, limpio y preparado como máscara. Todo es de dominio público.

En vivo: **[pedrogomez.dev/proyecto/ornamentos](https://pedrogomez.dev/proyecto/ornamentos/)**

## Qué hay dentro

- **Compositor de capitulares.** Escribes un párrafo, eliges alfabeto, color y alto en líneas, y la primera letra se convierte en capitular. Debajo sale el HTML y el CSS para pegar en cualquier web, y el SVG para descargar.
- **Florones.** Separadores entre apartados que se tiñen con `background-color`.
- **Catálogo.** Las 120 letras, una a una, descargables en SVG.
- **Fieles a la época.** Los alfabetos antiguos no tienen J, U ni W: el compositor usa la I, la V y la doble V, como se escribía entonces, y avisa cuando una letra no existe.

## Cómo se usa una capitular

La letra se pinta como máscara CSS, así toma el color del texto o el que se quiera:

```html
<p>
  <span class="capitular" aria-hidden="true"
        style="--capitular: url('https://www.pedrogomez.dev/proyecto/ornamentos/media/capitulares/barroco/E.svg'); aspect-ratio: 212 / 170;"></span>
  <span class="sr-only">E</span>n un lugar de la Mancha…
</p>
```

```css
.capitular {
  float: left;
  height: calc(4 * 1lh);
  margin: 0.15em 0.4em 0 0;
  background-color: #a8322a;
  mask: var(--capitular) center / contain no-repeat;
}
```

Los archivos de `media/` se sirven con CORS abierto para que funcionen como máscara desde cualquier dominio.

## Cómo se prepararon

Los scripts de Python están en [`pipeline/`](pipeline/):

1. `recortar.py`: cada lámina se gira y se convierte en una máscara de tinta. Las letras están en rejilla: los cortes empiezan equidistantes y se mueven al mínimo de tinta más cercano, porque los adornos de una letra casi tocan los de la siguiente. Después se quitan las manchas pequeñas que tocan el borde de la celda (trozos de la letra vecina). Cada letra se nombra con el orden de su lámina, comprobado a ojo (`alfabetos.py`).
2. `vectorizar.py`: la tinta se amplía al doble, se binariza y se traza con [potrace](https://potrace.sourceforge.net/) (`potracer`). El SVG usa `fill="currentColor"`. El alfabeto gótico es bicolor: el rojo de las rosetas se traza en su propia capa con `var(--ornamento-acento)`.
3. `florones.py`: son fotografías de trazos claros sobre un fondo con viñeteado. Una mediana quita el grano, el fondo se estima con un desenfoque grande y se resta, y lo que queda pasa a ser el canal alfa.
4. `catalogo.py`: escribe `app/datos/catalogo.json`, la única fuente de datos de la web.

```bash
python -m venv .venv && .venv/Scripts/pip install numpy pillow potracer
python pipeline/recortar.py <páginas> <recortes>
python pipeline/vectorizar.py <recortes> app/media
python pipeline/florones.py <fotos> app/media
python pipeline/catalogo.py
```

Las páginas del álbum se descargan de Internet Archive (`https://archive.org/download/alphabetalbumcol00silv/page/n<N>.jpg`).

## Desarrollo

```bash
npm test         # catálogo, archivos, SVG y elección de letras
npm run build    # genera dist/proyecto/ornamentos
npm run dev      # http://127.0.0.1:8040/proyecto/ornamentos/
```

Worker de Cloudflare con archivos estáticos (`wrangler.jsonc`), en `pedrogomez.dev/proyecto/ornamentos`: `npm run deploy`.

## Créditos

- Capitulares: J.-B. Silvestre, *Alphabet-album: collection de soixante feuilles d'alphabets historiés et fleuronnés*, París, 1843. Escaneo de la Boston Public Library en [Internet Archive](https://archive.org/details/alphabetalbumcol00silv).
- Florones: Edward J. Woolsey, *Specimens of Fancy Turning*, 1869, vía el [Public Domain Image Archive](https://pdimagearchive.org/).
