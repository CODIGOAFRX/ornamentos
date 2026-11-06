"""Escribe app/datos/catalogo.json: alfabetos (con sus letras y tamaños) y florones.

Uso: python pipeline/catalogo.py
Es la única fuente de datos de la web; se genera a partir de alfabetos.py y de lo que dejan
vectorizar.py y florones.py en pipeline/datos.
"""
import json
from pathlib import Path

from alfabetos import ALFABETOS

PIPELINE = Path(__file__).resolve().parent
APP = PIPELINE.parent / 'app'
FUENTE = {
    'titulo': 'Alphabet-album: collection de soixante feuilles d’alphabets historiés et fleuronnés',
    'autor': 'Joseph-Balthazar Silvestre',
    'anio': 1843,
    'url': 'https://archive.org/details/alphabetalbumcol00silv',
    'biblioteca': 'Boston Public Library',
}

vectorizado = json.loads((PIPELINE / 'datos' / 'vectorizado.json').read_text(encoding='utf-8'))
florones = json.loads((PIPELINE / 'datos' / 'florones.json').read_text(encoding='utf-8'))

# En el orden de alfabetos.py, del más antiguo al más moderno
alfabetos = []
for id_, cfg in ALFABETOS.items():
    if id_ not in vectorizado:
        raise SystemExit(f'{id_} no está vectorizado: python pipeline/vectorizar.py <recortes> app/media {id_}')
    alfabetos.append({
        'id': id_,
        'nombre': cfg['nombre'],
        'siglo': cfg['siglo'],
        'origen': cfg['origen'],
        'oscuro': bool(cfg.get('invertir')),
        'bicolor': bool(cfg.get('acento')),
        'letras': {l['letra']: [l['ancho'], l['alto']] for l in vectorizado[id_]},
    })

catalogo = {
    'fuente': FUENTE,
    'alfabetos': alfabetos,
    'florones': [{**f, 'autor': 'Edward J. Woolsey', 'obra': 'Specimens of Fancy Turning',
                  'url': f"https://pdimagearchive.org/images/{f['uuid']}/"} for f in florones],
}
(APP / 'datos').mkdir(exist_ok=True)
(APP / 'datos' / 'catalogo.json').write_text(json.dumps(catalogo, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(alfabetos), 'alfabetos,', sum(len(a['letras']) for a in alfabetos), 'letras,', len(florones), 'florones')
