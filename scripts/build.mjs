// Genera dist/proyecto/ornamentos (servido en pedrogomez.dev/proyecto/ornamentos) desde app/:
// copia la web y los ornamentos, versiona CSS y JS con un hash de su contenido y deja _headers en
// la raíz de dist, donde lo lee el Worker de archivos estáticos.
import { cp, readFile, rm, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = '/proyecto/ornamentos';
const dist = resolve(repo, 'dist');
const out = resolve(dist, base.slice(1));

await rm(dist, { recursive: true, force: true });
await cp(resolve(repo, 'app'), out, { recursive: true, filter: f => !f.endsWith('vectorizado.json') && !f.endsWith('florones.json') });
await rename(resolve(out, '_headers'), resolve(dist, '_headers'));

const hash = async file => createHash('sha256').update(await readFile(resolve(out, file))).digest('hex').slice(0, 10);
let html = await readFile(resolve(out, 'index.html'), 'utf8');
for (const [, file] of html.matchAll(/\{\{v:([^}]+)\}\}/g)) html = html.replace(`{{v:${file}}}`, await hash(file));
html = html.replaceAll('{{BASE}}', base);
await writeFile(resolve(out, 'index.html'), html);
console.log(`Generado ${out}`);
