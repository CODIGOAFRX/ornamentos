// Ornamentos: compositor de capitulares, florones y catálogo. Todo sale de datos/catalogo.json.
// La capitular se pinta como máscara CSS (mask-image con el SVG), así toma cualquier color con
// background-color; en el modo «Original» se usa la imagen con el color de la lámina.
import { letraPara } from './letras.js';

const BASE = '/proyecto/ornamentos';
const PUBLICO = `https://www.pedrogomez.dev${BASE}`;
const ALFABETO_INICIAL = 'barroco';
const $ = id => document.getElementById(id);

const catalogo = await fetch(`${BASE}/datos/catalogo.json`).then(r => r.json());

// Dónde están los ornamentos: en esta web o, para el código que se copia, con el dominio delante
const capitular = (a, letra, ext, raiz = BASE) => `${raiz}/media/capitulares/${a.id}/${letra}.${ext}`;
const floron = (nombre, raiz = BASE) => `${raiz}/media/florones/${nombre}.webp`;
const escapar = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- compositor ----------
$('alfabetos').innerHTML = catalogo.alfabetos.map(a => `
    <label class="alfabeto${a.oscuro ? ' es-oscuro' : ''}">
        <input type="radio" name="alfabeto" value="${a.id}"${a.id === ALFABETO_INICIAL ? ' checked' : ''}>
        <span class="alfabeto-muestra" style="--letra:url('${capitular(a, 'A', 'svg')}')"></span>
        <span class="alfabeto-nombre">${a.nombre}<small>Siglo ${a.siglo}</small></span>
    </label>`).join('');

const mandos = $('mandos').elements;

/** Lo elegido en el formulario, que es el único sitio donde se guarda. */
function opciones() {
    const color = mandos.color.value;
    return {
        a: catalogo.alfabetos.find(x => x.id === mandos.alfabeto.value),
        color,
        imagen: color === 'original',
        lineas: Number(mandos.lineas.value),
    };
}

function pintar() {
    const elegido = opciones();
    const { a, color, imagen, lineas } = elegido;
    const texto = mandos.texto.value.trim() || 'Escribe un párrafo.';
    const { letra, original, sustituta, resto } = letraPara(a, texto);
    const parrafo = $('parrafo');
    parrafo.style.setProperty('--lineas', lineas);
    parrafo.classList.toggle('sobre-oscuro', imagen && a.oscuro);
    $('lineas-valor').textContent = lineas;

    if (letra) {
        const [w, h] = a.letras[letra];
        const dibujo = imagen
            ? `<img class="capitular capitular-imagen" src="${capitular(a, letra, 'webp')}" alt="" style="aspect-ratio:${w} / ${h}">`
            : `<span class="capitular" aria-hidden="true" style="--capitular:url('${capitular(a, letra, 'svg')}');aspect-ratio:${w} / ${h};background-color:${color}"></span>`;
        parrafo.innerHTML = `${dibujo}<span class="sr-only">${escapar(original)}</span>${escapar(resto)}`;
    } else {
        parrafo.innerHTML = escapar(texto);
    }
    $('aviso').textContent = !letra && original
        ? `El alfabeto ${a.nombre.toLowerCase()} no tiene ${original}: el párrafo se queda sin capitular.`
        : sustituta ? `Sin ${original} en este alfabeto: se usa la ${sustituta}, como se escribía entonces.` : '';

    codigoCapitular(elegido, letra, original, resto);

    // La O del título es una capitular del alfabeto elegido
    const [w, h] = a.letras.O;
    $('h1-capitular').style.aspectRatio = `${w} / ${h}`;
    $('h1-capitular').style.setProperty('--letra', `url('${capitular(a, 'O', 'svg')}')`);
}

function codigoCapitular({ a, color, imagen, lineas }, letra, original, resto) {
    if (!letra) {
        $('html-capitular').textContent = '';
        $('css-capitular').textContent = '';
        $('descargas').innerHTML = '';
        return;
    }
    const extracto = escapar(resto.length > 60 ? `${resto.slice(0, 60).trim()}…` : resto);
    const [w, h] = a.letras[letra];
    const html = imagen
        ? `<p class="con-capitular">\n  <img class="capitular" src="${capitular(a, letra, 'webp', PUBLICO)}" alt="" width="${w}" height="${h}"><span class="sr-only">${escapar(original)}</span>${extracto}\n</p>`
        : `<p class="con-capitular">\n  <span class="capitular" aria-hidden="true" style="--capitular: url('${capitular(a, letra, 'svg', PUBLICO)}'); aspect-ratio: ${w} / ${h};"></span><span class="sr-only">${escapar(original)}</span>${extracto}\n</p>`;
    const css = `.capitular {
  float: left;
  height: calc(${lineas} * 1lh);
  margin: 0.15em 0.4em 0 0;${imagen ? '' : `
  background-color: ${color};
  -webkit-mask: var(--capitular) center / contain no-repeat;
  mask: var(--capitular) center / contain no-repeat;`}
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}`;
    $('html-capitular').textContent = html;
    $('css-capitular').textContent = css;
    $('descargas').innerHTML = `
        <a href="${capitular(a, letra, 'svg')}" download="${a.id}-${letra}.svg">SVG</a>
        <a href="${capitular(a, letra, 'webp')}" download="${a.id}-${letra}.webp">WebP original</a>`;
}

$('mandos').addEventListener('input', pintar);

// ---------- florones ----------
$('lista-florones').innerHTML = catalogo.florones.map((f, i) => `
    <label class="floron">
        <input type="radio" name="floron" value="${f.id}"${i === 0 ? ' checked' : ''}>
        <span class="floron-muestra-mini" style="--floron:url('${floron(`${f.id}-mini`)}')"></span>
        <span class="sr-only">Florón ${i + 1}</span>
    </label>`).join('');

function pintarFloron() {
    const id = document.querySelector('input[name="floron"]:checked').value;
    $('floron-muestra').style.setProperty('--floron', `url('${floron(id)}')`);
    $('codigo-floron').textContent = `<hr class="floron" style="--floron: url('${floron(id, PUBLICO)}');">

.floron {
  height: 4.5rem;
  margin: 2.5rem auto;
  border: 0;
  background-color: currentColor;
  -webkit-mask: var(--floron) center / contain no-repeat;
  mask: var(--floron) center / contain no-repeat;
}`;
}
$('lista-florones').addEventListener('input', pintarFloron);

// ---------- catálogo ----------
$('lista-catalogo').innerHTML = catalogo.alfabetos.map(a => `
    <article class="alfabeto-catalogo${a.oscuro ? ' es-oscuro' : ''}" aria-labelledby="cat-${a.id}">
        <h3 id="cat-${a.id}">${a.nombre} <small>siglo ${a.siglo} · ${a.origen}${a.bicolor ? ' · bicolor' : ''}</small></h3>
        <ul class="letras">
            ${Object.keys(a.letras).map(l => `<li><a href="${capitular(a, l, 'svg')}" download="${a.id}-${l}.svg" title="Descargar ${l} en SVG"><img src="${capitular(a, l, 'svg')}" alt="${l}" loading="lazy" decoding="async"></a></li>`).join('')}
        </ul>
    </article>`).join('');

// ---------- copiar ----------
document.addEventListener('click', async evento => {
    const boton = evento.target.closest('[data-copiar]');
    if (!boton) return;
    const texto = boton.dataset.copiar === 'capitular'
        ? `${$('html-capitular').textContent}\n\n<style>\n${$('css-capitular').textContent}\n</style>`
        : $('codigo-floron').textContent;
    const aviso = $('aviso-copia');
    try {
        await navigator.clipboard.writeText(texto);
        aviso.textContent = 'Copiado.';
    } catch {
        aviso.textContent = 'No se ha podido copiar: selecciona el código y cópialo a mano.';
    }
    aviso.classList.add('visible');
    clearTimeout(aviso.temporizador);
    aviso.temporizador = setTimeout(() => aviso.classList.remove('visible'), 2200);
});

pintar();
pintarFloron();
