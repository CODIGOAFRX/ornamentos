import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { letraPara } from '../app/letras.js';

const catalogo = JSON.parse(await readFile(new URL('../app/datos/catalogo.json', import.meta.url), 'utf8'));
const media = p => new URL(`../app/media/${p}`, import.meta.url);

test('el catálogo trae cinco alfabetos con sus letras y la fuente', () => {
    assert.equal(catalogo.alfabetos.length, 5);
    assert.match(catalogo.fuente.url, /archive\.org\/details\/alphabetalbumcol00silv/);
    for (const a of catalogo.alfabetos) {
        assert.ok(a.nombre && a.siglo && a.origen, a.id);
        assert.ok(Object.keys(a.letras).length >= 22, `${a.id} con pocas letras`);
        assert.ok(a.letras.O, `${a.id} sin O (la usa el título)`);
        for (const [w, h] of Object.values(a.letras)) assert.ok(w > 20 && h > 20);
    }
});

test('cada letra y cada florón tienen sus archivos', async () => {
    for (const a of catalogo.alfabetos) {
        for (const l of Object.keys(a.letras)) {
            for (const ext of ['svg', 'webp']) assert.ok((await stat(media(`capitulares/${a.id}/${l}.${ext}`))).size > 500, `${a.id}/${l}.${ext}`);
        }
    }
    for (const f of catalogo.florones) {
        assert.ok((await stat(media(`florones/${f.id}.webp`))).size > 1000);
        assert.ok((await stat(media(`florones/${f.id}-mini.webp`))).size > 200);
        assert.match(f.url, /^https:\/\/pdimagearchive\.org\/images\/[0-9a-f-]{36}\/$/);
    }
});

test('los SVG trazan la letra (no el papel) y se tiñen con currentColor', async () => {
    const svg = await readFile(media('capitulares/barroco/A.svg'), 'utf8');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+"/);
    assert.match(svg, /fill="currentColor"/);
    // Si se trazara el papel, el primer punto estaría en una esquina del lienzo
    const [, x, y] = svg.match(/d="M([\d.]+) ([\d.]+)/);
    assert.ok(!(Number(x) === 0 && Number(y) === 0));
    const gotico = await readFile(media('capitulares/gotico/A.svg'), 'utf8');
    assert.match(gotico, /var\(--ornamento-acento/);
});

test('la letra se elige sin tildes y con las sustitutas de la época', () => {
    const veneciano = catalogo.alfabetos.find(a => a.id === 'veneciano');
    const barroco = catalogo.alfabetos.find(a => a.id === 'barroco');
    assert.equal(letraPara(barroco, '  «Érase una vez»').letra, 'E');
    assert.deepEqual(letraPara(veneciano, 'Juan'), { letra: 'I', original: 'J', sustituta: 'I' });
    assert.deepEqual(letraPara(veneciano, 'Una vez'), { letra: 'V', original: 'U', sustituta: 'V' });
    assert.deepEqual(letraPara(barroco, 'Ñandú'), { letra: 'N', original: 'Ñ', sustituta: 'N' });
    assert.equal(letraPara(veneciano, 'Kilo').letra, null);
    assert.equal(letraPara(barroco, '123').letra, null);
});
