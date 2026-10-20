// Ornamentos: compositor de capitulares, florones y catálogo. Todo sale de datos/catalogo.json.
// La capitular se pinta como máscara CSS (mask-image con el SVG), así toma cualquier color con
// background-color; en el modo «Original» se usa la imagen con el color de la lámina.
import { letraPara } from './letras.js';

const BASE = '/proyecto/ornamentos';
const PUBLICO = `https://www.pedrogomez.dev${BASE}`;
const $ = id => document.getElementById(id);

const catalogo = await fetch(`${BASE}/datos/catalogo.json`).then(r => r.json());
const estado = { alfabeto: 'barroco', color: '#1d1b17', lineas: 4, floron: catalogo.florones[0].id };

const url = (a, letra, ext) => `${BASE}/media/capitulares/${a.id}/${letra}.${ext}`;
const escapar = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- compositor ----------
const alfabetosCaja = $('alfabetos');
alfabetosCaja.innerHTML = catalogo.alfabetos.map(a => `
    <label class="alfabeto${a.oscuro ? ' es-oscuro' : ''}">
        <input type="radio" name="alfabeto" value="${a.id}"${a.id === estado.alfabeto ? ' checked' : ''}>
        <span class="alfabeto-muestra" style="--letra:url('${url(a, 'A', 'svg')}')"></span>
        <span class="alfabeto-nombre">${a.nombre}<small>Siglo ${a.siglo}</small></span>
    </label>`).join('');

function pintar() {
    const a = catalogo.alfabetos.find(x => x.id === estado.alfabeto);
    const texto = $('texto').value.trim() || 'Escribe un párrafo.';
    const { letra, original, sustituta } = letraPara(a, texto);
    const resto = texto.slice(texto.indexOf(original) + original.length);
    const parrafo = $('parrafo');
    const original_ = estado.color === 'original';
    parrafo.style.setProperty('--lineas', estado.lineas);
    parrafo.classList.toggle('sobre-oscuro', original_ && a.oscuro);

    let capitular = '';
    if (letra) {
        const [w, h] = a.letras[letra];
        capitular = original_
            ? `<img class="capitular capitular-imagen" src="${url(a, letra, 'webp')}" alt="" style="aspect-ratio:${w} / ${h}">`
            : `<span class="capitular" aria-hidden="true" style="--capitular:url('${url(a, letra, 'svg')}');aspect-ratio:${w} / ${h};background-color:${estado.color}"></span>`;
        capitular += `<span class="sr-only">${escapar(original)}</span>`;
        parrafo.innerHTML = capitular + escapar(resto);
    } else {
        parrafo.innerHTML = escapar(texto);
    }
    $('aviso').textContent = !letra && original
        ? `El alfabeto ${a.nombre.toLowerCase()} no tiene ${original}: el párrafo se queda sin capitular.`
        : sustituta ? `Sin ${original} en este alfabeto: se usa la ${sustituta}, como se escribía entonces.` : '';

    codigoCapitular(a, letra, original, resto);
}

function codigoCapitular(a, letra, original, resto) {
    const extracto = escapar(resto.length > 60 ? `${resto.slice(0, 60).trim()}…` : resto);
    if (!letra) {
        $('html-capitular').textContent = '';
        $('css-capitular').textContent = '';
        $('descargas').innerHTML = '';
        return;
    }
    const [w, h] = a.letras[letra];
    const original_ = estado.color === 'original';
    const html = original_
        ? `<p class="con-capitular">\n  <img class="capitular" src="${PUBLICO}/media/capitulares/${a.id}/${letra}.webp" alt="" width="${w}" height="${h}"><span class="sr-only">${escapar(original)}</span>${extracto}\n</p>`
        : `<p class="con-capitular">\n  <span class="capitular" aria-hidden="true" style="--capitular: url('${PUBLICO}/media/capitulares/${a.id}/${letra}.svg'); aspect-ratio: ${w} / ${h};"></span><span class="sr-only">${escapar(original)}</span>${extracto}\n</p>`;
    const css = `.capitular {
  float: left;
  height: calc(${estado.lineas} * 1lh);
  margin: 0.15em 0.4em 0 0;${original_ ? '' : `
  background-color: ${estado.color};
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
        <a href="${url(a, letra, 'svg')}" download="${a.id}-${letra}.svg">SVG</a>
        <a href="${url(a, letra, 'webp')}" download="${a.id}-${letra}.webp">WebP original</a>`;
}

$('mandos').addEventListener('input', evento => {
    const t = evento.target;
    if (t.name === 'alfabeto') estado.alfabeto = t.value;
    if (t.name === 'color') estado.color = t.value;
    if (t.id === 'lineas') {
        estado.lineas = Number(t.value);
        $('lineas-valor').textContent = t.value;
    }
    pintar();
});

// ---------- florones ----------
const listaFlorones = $('lista-florones');
listaFlorones.innerHTML = catalogo.florones.map((f, i) => `
    <label class="floron">
        <input type="radio" name="floron" value="${f.id}"${i === 0 ? ' checked' : ''}>
        <span class="floron-muestra-mini" style="--floron:url('${BASE}/media/florones/${f.id}-mini.webp')"></span>
        <span class="sr-only">Florón ${i + 1}</span>
    </label>`).join('');

function pintarFloron() {
    const f = catalogo.florones.find(x => x.id === estado.floron);
    $('floron-muestra').style.setProperty('--floron', `url('${BASE}/media/florones/${f.id}.webp')`);
    $('codigo-floron').textContent = `<hr class="floron" style="--floron: url('${PUBLICO}/media/florones/${f.id}.webp');">

.floron {
  height: 4.5rem;
  margin: 2.5rem auto;
  border: 0;
  background-color: currentColor;
  -webkit-mask: var(--floron) center / contain no-repeat;
  mask: var(--floron) center / contain no-repeat;
}`;
}
listaFlorones.addEventListener('input', evento => {
    estado.floron = evento.target.value;
    pintarFloron();
});

// ---------- catálogo ----------
$('lista-catalogo').innerHTML = catalogo.alfabetos.map(a => `
    <article class="alfabeto-catalogo${a.oscuro ? ' es-oscuro' : ''}" aria-labelledby="cat-${a.id}">
        <h3 id="cat-${a.id}">${a.nombre} <small>siglo ${a.siglo} · ${a.origen}${a.bicolor ? ' · bicolor' : ''}</small></h3>
        <ul class="letras">
            ${Object.keys(a.letras).map(l => `<li><a href="${url(a, l, 'svg')}" download="${a.id}-${l}.svg" title="Descargar ${l} en SVG"><img src="${url(a, l, 'svg')}" alt="${l}" loading="lazy" decoding="async"></a></li>`).join('')}
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

// La O del título es una capitular del alfabeto elegido
const tituloCapitular = () => {
    const a = catalogo.alfabetos.find(x => x.id === estado.alfabeto);
    const [w, h] = a.letras.O;
    Object.assign($('h1-capitular').style, { aspectRatio: `${w} / ${h}` });
    $('h1-capitular').style.setProperty('--letra', `url('${url(a, 'O', 'svg')}')`);
};
$('mandos').addEventListener('input', tituloCapitular);

pintar();
pintarFloron();
tituloCapitular();
