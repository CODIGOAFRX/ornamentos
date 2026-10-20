"""Escribe app/datos/catalogo.json: alfabetos (con sus letras y tamaños) y florones.

Uso: python pipeline/catalogo.py
Es la única fuente de datos de la web; se genera a partir de alfabetos.py y de lo que dejan
vectorizar.py y florones.py en app/media.
"""
import json
from pathlib import Path

from alfabetos import ALFABETOS

APP = Path(__file__).resolve().parent.parent / 'app'
FUENTE = {
    'titulo': 'Alphabet-album: collection de soixante feuilles d’alphabets historiés et fleuronnés',
    'autor': 'Joseph-Balthazar Silvestre',
    'anio': 1843,
    'url': 'https://archive.org/details/alphabetalbumcol00silv',
    'biblioteca': 'Boston Public Library',
}

vectorizado = json.loads((APP / 'media' / 'capitulares' / 'vectorizado.json').read_text(encoding='utf-8'))
florones = json.loads((APP / 'media' / 'florones' / 'florones.json').read_text(encoding='utf-8'))

alfabetos = []
for id_, cfg in ALFABETOS.items():
    if id_ not in vectorizado:
        continue
    alfabetos.append({
        'id': id_,
        'nombre': cfg['nombre'],
        'siglo': cfg['siglo'],
        'origen': cfg['origen'],
        'oscuro': bool(cfg.get('invertir')),
        'bicolor': bool(cfg.get('acento')),
        'letras': {l['letra']: [l['ancho'], l['alto']] for l in vectorizado[id_]},
    })
# Del más antiguo al más moderno
orden = {'XI': 11, 'XIV': 14, 'XVI': 16, 'XVIII': 18, 'XIX': 19}
alfabetos.sort(key=lambda a: orden.get(a['siglo'], 99))

catalogo = {
    'fuente': FUENTE,
    'alfabetos': alfabetos,
    'florones': [{**f, 'autor': 'Edward J. Woolsey', 'obra': 'Specimens of Fancy Turning',
                  'url': f"https://pdimagearchive.org/images/{f['uuid']}/"} for f in florones],
}
(APP / 'datos').mkdir(exist_ok=True)
(APP / 'datos' / 'catalogo.json').write_text(json.dumps(catalogo, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(alfabetos), 'alfabetos,', sum(len(a['letras']) for a in alfabetos), 'letras,', len(florones), 'florones')
