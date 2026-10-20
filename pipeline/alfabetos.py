"""Alfabetos elegidos del Alphabet-album de J.-B. Silvestre (París, 1843).

Fuente: https://archive.org/details/alphabetalbumcol00silv (Boston Public Library, dominio público).
`pagina` es la página del escaneo; `marco`, la zona de las letras una vez girada la lámina
(fracciones de ancho y alto); `por_fila`, cuántas casillas hay en cada fila; `letras`, qué hay
en cada casilla, en orden de lectura ('_' = adorno o variante que no se usa). El orden se ha
comprobado a ojo en cada lámina: los alfabetos antiguos no traen J, U ni W, y la web las
sustituye por I, V y VV como se hacía entonces.
"""

ALFABETOS = {
    'gotico': {
        'nombre': 'Gótico alemán',
        'siglo': 'XIV',
        'origen': 'Manuscrito de Viena',
        'pagina': 'p010',
        'marco': (0.09, 0.19, 0.91, 0.675),
        'por_fila': [8, 8, 8],
        'letras': 'ABCDEFGH' 'IKLMNOPQ' 'RSTUVXYZ',
        # Bicolor: la letra en tinta y la roseta en rojo, que se traza en su propia capa
        'acento': 38,
    },
    'veneciano': {
        'nombre': 'Veneciano',
        'siglo': 'XVI',
        'origen': 'Manuscrito de Venecia',
        'pagina': 'p014',
        'marco': (0.12, 0.19, 0.84, 0.69),
        'por_fila': [8, 8, 8],
        'letras': 'ABCDEFGH' 'ILMNOPQR' '_STVXYZ_',
    },
    'romanico': {
        'nombre': 'Románico alemán',
        'siglo': 'XI',
        'origen': 'Evangeliario, Biblioteca Real de Múnich',
        'pagina': 'p048',
        'marco': (0.26, 0.235, 0.75, 0.745),
        'por_fila': [7, 7, 7, 7],
        'letras': 'ABCDEFG' 'HIKLMNO' 'PQRSTUV' 'XYZ____',
        # Letras claras sobre fondo negro: la tinta es lo claro
        'invertir': True,
    },
    'barroco': {
        'nombre': 'Barroco alemán',
        'siglo': 'XVIII',
        'origen': 'Manuscrito de Viena',
        'pagina': 'p058',
        'marco': (0.23, 0.18, 0.76, 0.81),
        'por_fila': [5, 5, 5, 5, 5],
        'letras': 'ABCDE' 'FGHIK' 'LMNOP' 'QRSTU' 'VWXYZ',
    },
    'rustico': {
        'nombre': 'Rústico',
        'siglo': 'XIX',
        'origen': 'Alfabeto forestal francés',
        'pagina': 'p066',
        'marco': (0.19, 0.17, 0.808, 0.81),
        'por_fila': [7, 6, 6, 6],
        'letras': 'ABCDEFG' 'HIKLMN' 'OPQRST' 'UVWXYZ',
    },
}
