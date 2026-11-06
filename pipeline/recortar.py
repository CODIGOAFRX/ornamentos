"""Recorta cada letra de las láminas del Alphabet-album de Silvestre (1843).

Uso: python pipeline/recortar.py <carpeta_paginas> <carpeta_salida> [alfabeto ...]

Cada lámina se gira, se recorta a la zona de las letras y se convierte en una máscara de tinta
(lo que no es papel). Las letras están en rejilla: los cortes entre filas y columnas empiezan
equidistantes y se mueven al mínimo de tinta más cercano, porque los adornos de una letra casi
tocan los de la siguiente. Cada letra se guarda en PNG con la tinta como canal alfa y se nombra
en el orden de la lámina con la lista de `letras` de su alfabeto (alfabetos.py).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from alfabetos import ALFABETOS


def mascara_tinta(rgb, invertir=False):
    """Probabilidad de tinta por píxel (0 papel, 1 tinta), a partir de la luminosidad."""
    gris = np.asarray(rgb.convert('L'), dtype=np.float32)
    if invertir:
        gris = 255 - gris
    papel = np.percentile(gris, 70)
    tinta = np.percentile(gris, 2)
    return np.clip((papel - 18 - gris) / max(1.0, papel - 18 - tinta), 0, 1)


def componentes(mascara):
    """Etiqueta las manchas conectadas (8 vecinos) de una máscara booleana pequeña."""
    etiquetas = np.zeros(mascara.shape, dtype=np.int32)
    alto, ancho = mascara.shape
    n = 0
    for y0, x0 in zip(*np.nonzero(mascara)):
        if etiquetas[y0, x0]:
            continue
        n += 1
        pila = [(y0, x0)]
        etiquetas[y0, x0] = n
        while pila:
            y, x = pila.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < alto and 0 <= xx < ancho and mascara[yy, xx] and not etiquetas[yy, xx]:
                        etiquetas[yy, xx] = n
                        pila.append((yy, xx))
    return etiquetas, n


def limpiar_celda(mascara, borde=4, minimo=0.02):
    """Quita las manchas pequeñas que tocan el borde de la celda: son trozos de la casilla vecina."""
    etiquetas, n = componentes(mascara)
    total = mascara.sum()
    quitar = np.zeros(n + 1, dtype=bool)
    for k in range(1, n + 1):
        ys, xs = np.nonzero(etiquetas == k)
        toca = ys.min() < borde or xs.min() < borde or ys.max() >= mascara.shape[0] - borde or xs.max() >= mascara.shape[1] - borde
        quitar[k] = toca and len(ys) < total * minimo
    return quitar[etiquetas]


def cortes(perfil, n, margen=0.22):
    """Divide el perfil en n partes: empieza con cortes equidistantes entre el primer y el último
    píxel con tinta y mueve cada uno al mínimo de tinta (suavizado) dentro de su ventana."""
    con_tinta = np.nonzero(perfil > perfil.max() * 0.02)[0]
    a, b = int(con_tinta[0]), int(con_tinta[-1]) + 1
    paso = (b - a) / n
    suave = np.convolve(perfil, np.ones(9) / 9, mode='same')
    limites = [a]
    for i in range(1, n):
        c = a + paso * i
        lo, hi = int(c - paso * margen), int(c + paso * margen)
        limites.append(lo + int(np.argmin(suave[lo:hi])))
    limites.append(b)
    return list(zip(limites[:-1], limites[1:]))


def recortar(cfg, paginas, salida):
    salida.mkdir(parents=True, exist_ok=True)
    # Las láminas del escaneo están apaisadas: se ponen derechas
    imagen = Image.open(paginas / f"{cfg['pagina']}.jpg").convert('RGB').rotate(-90, expand=True)
    w, h = imagen.size
    l, t, r, b = cfg['marco']
    marco = imagen.crop((int(w * l), int(h * t), int(w * r), int(h * b)))
    tinta = mascara_tinta(marco, cfg.get('invertir', False))
    bin_ = tinta > 0.35

    Image.fromarray((bin_ * 255).astype(np.uint8)).save(salida / f"_{cfg['id']}-mascara.png")
    esperadas = cfg['por_fila']
    filas = cortes(bin_.sum(1), len(esperadas))

    letras = list(cfg['letras'])
    piezas, k = [], 0
    for (y0, y1), n in zip(filas, esperadas):
        columnas = cortes(bin_[y0:y1].sum(0), n)
        for x0, x1 in columnas:
            # Fuera los trozos de las letras vecinas; después, caja ajustada a la tinta con un margen
            sobra = limpiar_celda(bin_[y0:y1, x0:x1])
            tinta[y0:y1, x0:x1][sobra] = 0
            bin_[y0:y1, x0:x1][sobra] = False
            sub = bin_[y0:y1, x0:x1]
            ys, xs = np.nonzero(sub)
            m = 6
            alto, ancho = bin_.shape
            caja = (max(0, x0 + xs.min() - m), max(0, y0 + ys.min() - m),
                    min(ancho, x0 + xs.max() + m), min(alto, y0 + ys.max() + m))
            nombre = letras[k]
            k += 1
            if nombre == '_':
                continue
            # Color original con la tinta como canal alfa: el papel desaparece
            pieza = marco.crop(caja).convert('RGBA')
            x0c, y0c, x1c, y1c = caja
            alfa = np.clip(tinta[y0c:y1c, x0c:x1c] * 255, 0, 255).astype(np.uint8)
            pieza.putalpha(Image.fromarray(alfa))
            destino = salida / cfg['id']
            destino.mkdir(parents=True, exist_ok=True)
            pieza.save(destino / f'{nombre}.png')
            piezas.append({'letra': nombre, 'ancho': pieza.width, 'alto': pieza.height})
    if k != len(letras):
        raise SystemExit(f"{cfg['id']}: {k} casillas y {len(letras)} letras")
    return piezas


if __name__ == '__main__':
    paginas, salida = Path(sys.argv[1]), Path(sys.argv[2])
    elegidos = sys.argv[3:] or list(ALFABETOS)
    for id_ in elegidos:
        piezas = recortar({'id': id_, **ALFABETOS[id_]}, paginas, salida)
        print(id_, len(piezas), 'letras')
