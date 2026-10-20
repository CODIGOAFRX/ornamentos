"""Florones: los dibujos de torno de Edward J. Woolsey (Specimens of Fancy Turning, 1869).

Uso: python pipeline/florones.py <carpeta_fotos> <carpeta_app_media>

Son fotografías de trazos claros sobre un fondo oscuro con viñeteado. El fondo se estima con un
desenfoque grande y se resta: lo que queda por encima es el trazo, que pasa a ser el canal alfa
de una imagen blanca. En la web se usan como máscara CSS (mask-image), así toman el color que
se quiera con background-color.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

# Las que tienen papel claro, arañazos o poco contraste se quedan fuera
ELEGIDOS = [1, 2, 3, 4, 5, 7, 8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 27, 28, 30]
LADO = 900


def floron(foto):
    img = Image.open(foto).convert('L')
    w, h = img.size
    # Fuera los bordes de papel de la copia fotográfica
    m = 0.08
    img = img.crop((int(w * m), int(h * m), int(w * (1 - m)), int(h * (1 - m))))
    # La mediana quita el grano y el polvo de la copia sin comerse los trazos finos
    limpia = img.filter(ImageFilter.MedianFilter(3))
    gris = np.asarray(limpia, dtype=np.float32)
    fondo = np.asarray(limpia.filter(ImageFilter.GaussianBlur(18)), dtype=np.float32)
    trazo = np.clip((gris - fondo - 13) / 32, 0, 1)
    # Lo que toca el borde es el canto de la fotografía, no el dibujo
    b = int(min(trazo.shape) * 0.03)
    trazo[:b], trazo[-b:], trazo[:, :b], trazo[:, -b:] = 0, 0, 0, 0
    # Encuadre: la caja de los trazos, cuadrada y centrada
    ys, xs = np.nonzero(trazo > 0.5)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    lado = max(xs.max() - xs.min(), ys.max() - ys.min()) * 1.06 / 2
    caja = tuple(int(v) for v in (cx - lado, cy - lado, cx + lado, cy + lado))
    alfa = Image.fromarray((trazo * 255).astype(np.uint8)).crop(caja).resize((LADO, LADO), Image.LANCZOS)
    blanca = Image.new('RGBA', (LADO, LADO), (255, 255, 255, 0))
    blanca.putalpha(alfa)
    return blanca


if __name__ == '__main__':
    fotos, media = Path(sys.argv[1]), Path(sys.argv[2])
    meta = {m['archivo']: m for m in json.loads((fotos / 'meta.json').read_text(encoding='utf-8'))}
    destino = media / 'florones'
    destino.mkdir(parents=True, exist_ok=True)
    catalogo = []
    for n in ELEGIDOS:
        archivo = f'lathe-patterns-{n:05d}.jpg'
        nombre = f'torno-{n:02d}'
        imagen = floron(fotos / archivo)
        imagen.save(destino / f'{nombre}.webp', quality=78, method=6)
        # Miniatura para la rejilla de la web: 23 florones grandes pesarían varios megas
        imagen.resize((220, 220), Image.LANCZOS).save(destino / f'{nombre}-mini.webp', quality=80, method=6)
        catalogo.append({'id': nombre, 'uuid': meta[archivo]['uuid'], 'anio': meta[archivo]['anio']})
    (destino / 'florones.json').write_text(json.dumps(catalogo, ensure_ascii=False, indent=1), encoding='utf-8')
    print(len(catalogo), 'florones')
