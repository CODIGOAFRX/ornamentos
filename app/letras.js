// Qué letra del alfabeto le corresponde al texto. Los alfabetos antiguos no tienen J, U, W ni Ñ:
// se escribían con I, V, VV y N, y así se sustituyen. Las tildes no cuentan.
const SUSTITUTAS = { J: 'I', U: 'V', W: 'V', Ñ: 'N' };

const sinTilde = l => l.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** `original` es la primera letra del texto, en mayúscula; `resto`, todo lo que va detrás de ella. */
export function letraPara(alfabeto, texto) {
    const encontrada = String(texto).match(/\p{L}/u);
    if (!encontrada) return { letra: null, original: '', sustituta: null, resto: String(texto) };
    const original = encontrada[0].toUpperCase();
    const resto = encontrada.input.slice(encontrada.index + encontrada[0].length);
    // La Ñ se descompone en N + tilde: se busca antes como sustituta para avisar de ella
    const base = original === 'Ñ' ? original : sinTilde(original) || original;
    if (alfabeto.letras[base]) return { letra: base, original, sustituta: null, resto };
    const sustituta = SUSTITUTAS[base];
    if (sustituta && alfabeto.letras[sustituta]) return { letra: sustituta, original, sustituta, resto };
    return { letra: null, original, sustituta: null, resto };
}
