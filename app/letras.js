// Qué letra del alfabeto le corresponde al texto. Los alfabetos antiguos no tienen J, U, W ni Ñ:
// se escribían con I, V, VV y N, y así se sustituyen. Las tildes no cuentan.
export const SUSTITUTAS = { J: 'I', U: 'V', W: 'V', Ñ: 'N', Ç: 'C' };

const sinTilde = l => l.normalize('NFD').replace(/[̀-ͯ]/g, '');

export function letraPara(alfabeto, texto) {
    const primera = (String(texto).trim().match(/\p{L}/u) || [''])[0].toUpperCase();
    // La Ñ se descompone en N + tilde: se busca antes como sustituta para avisar de ella
    const base = primera === 'Ñ' ? primera : sinTilde(primera) || primera;
    if (alfabeto.letras[base]) return { letra: base, original: primera, sustituta: null };
    const sustituta = SUSTITUTAS[base];
    if (sustituta && alfabeto.letras[sustituta]) return { letra: sustituta, original: primera, sustituta };
    return { letra: null, original: primera, sustituta: null };
}
