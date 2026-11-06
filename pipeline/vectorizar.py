"""Convierte cada letra recortada en SVG (trazada con potrace) y en WebP con su color original.

Uso: python pipeline/vectorizar.py <carpeta_recortes> <carpeta_app_media> [alfabeto ...]

- SVG: la tinta se amplía al doble con interpolación (así los bordes salen suaves), se binariza
  y se traza con potrace. Un solo trazado con fill-rule evenodd y fill="currentColor": la letra
  toma el color del texto que la rodea. Si el alfabeto tiene `acento`, los píxeles de ese color
  (el rojo de las láminas bicolores) se trazan aparte con var(--ornamento-acento).
- WebP: el recorte con su papel transparente, en el color de la lámina, a 480 px de alto.

Los tamaños de cada letra se guardan en pipeline/datos/vectorizado.json, de donde los lee catalogo.py.
Si se vectorizan sólo algunos alfabetos, los demás se conservan.
"""
import json
import sys
from pathlib import Path

import numpy as np
import potrace
from PIL import Image

from alfabetos import ALFABETOS

ESCALA = 2
DATOS = Path(__file__).resolve().parent / 'datos' / 'vectorizado.json'


def trazado(mascara):
    """Mascara booleana → atributo d de un path SVG (en píxeles de la mascara)."""
    # potracer traza los píxeles a False (como el negro de un mapa de bits de potrace): se invierte
    curvas = potrace.Bitmap(~mascara).trace(turdsize=6, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                                           alphamax=1.0, opticurve=True, opttolerance=0.25)
    f = lambda p: f'{p.x:.1f} {p.y:.1f}'
    partes = []
    for curva in curvas:
        partes.append(f'M{f(curva.start_point)}')
        for s in curva.segments:
            partes.append(f'L{f(s.c)}L{f(s.end_point)}' if s.is_corner else f'C{f(s.c1)} {f(s.c2)} {f(s.end_point)}')
        partes.append('Z')
    return ''.join(partes)


def vectorizar(png, cfg):
    img = Image.open(png).convert('RGBA')
    w, h = img.size
    grande = img.resize((w * ESCALA, h * ESCALA), Image.LANCZOS)
    alfa = np.asarray(grande.getchannel('A'), dtype=np.float32) / 255
    capas = []
    if cfg.get('acento'):
        rgb = np.asarray(grande.convert('RGB'), dtype=np.float32)
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        rojo = (r - (g + b) / 2) > cfg['acento']
        oscuro = alfa > 0.5
        capas.append(('var(--ornamento-acento, #b5432f)', rojo & (alfa > 0.2) & ~(oscuro & ~rojo)))
        capas.append(('currentColor', oscuro & ~rojo))
    else:
        capas.append(('currentColor', alfa > 0.5))
    rutas = [f'<path fill="{color}" fill-rule="evenodd" d="{trazado(m)}"/>' for color, m in capas if m.any()]
    vista = f'0 0 {w * ESCALA} {h * ESCALA}'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vista}" width="{w}" height="{h}">'
           + ''.join(rutas) + '</svg>')
    return svg, img


if __name__ == '__main__':
    recortes, media = Path(sys.argv[1]), Path(sys.argv[2])
    elegidos = sys.argv[3:] or list(ALFABETOS)
    catalogo = json.loads(DATOS.read_text(encoding='utf-8')) if DATOS.exists() else {}
    for id_ in elegidos:
        cfg = ALFABETOS[id_]
        destino = media / 'capitulares' / id_
        destino.mkdir(parents=True, exist_ok=True)
        letras = []
        for png in sorted((recortes / id_).glob('*.png')):
            svg, img = vectorizar(png, cfg)
            (destino / f'{png.stem}.svg').write_text(svg, encoding='utf-8')
            vista = img.copy()
            vista.thumbnail((10_000, 480))
            vista.save(destino / f'{png.stem}.webp', quality=82, method=6)
            letras.append({'letra': png.stem, 'ancho': img.width, 'alto': img.height, 'kb': round(len(svg) / 1024, 1)})
        catalogo[id_] = letras
        print(id_, len(letras), 'letras,', round(sum(l['kb'] for l in letras)), 'KB de SVG')
    DATOS.parent.mkdir(exist_ok=True)
    DATOS.write_text(json.dumps(catalogo, ensure_ascii=False, indent=1), encoding='utf-8')
