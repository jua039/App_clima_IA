/**
 * utils.js
 * -----------------------------------------------------------------
 * Funciones auxiliares "puras": reciben un dato y devuelven otro dato,
 * sin tocar el DOM ni hacer peticiones a internet. Esto las hace
 * fáciles de leer, probar y reutilizar.
 * -----------------------------------------------------------------
 */

/**
 * Tabla que traduce cada "weathercode" (código numérico que usa Open-Meteo)
 * a una descripción en español.
 * Fuente oficial de los códigos: https://open-meteo.com/en/docs
 */
const DESCRIPCIONES_CLIMA = {
  0: 'Despejado',
  1: 'Parcialmente nublado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna intensa',
  56: 'Llovizna helada ligera',
  57: 'Llovizna helada intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia intensa',
  66: 'Lluvia helada ligera',
  67: 'Lluvia helada intensa',
  71: 'Nevada ligera',
  73: 'Nevada moderada',
  75: 'Nevada intensa',
  77: 'Granos de nieve',
  80: 'Chubascos ligeros',
  81: 'Chubascos moderados',
  82: 'Chubascos violentos',
  85: 'Chubascos de nieve ligeros',
  86: 'Chubascos de nieve intensos',
  95: 'Tormenta eléctrica',
  96: 'Tormenta con granizo ligero',
  99: 'Tormenta con granizo intenso',
};

/**
 * traducirWeatherCode(codigo)
 * ----------------------------
 * Recibe el código numérico del clima y devuelve su descripción en español.
 * Si el código no existe en nuestra tabla, devolvemos un texto genérico
 * en vez de dejar que la app falle.
 *
 * @param {number} codigo - weathercode que devuelve Open-Meteo.
 * @returns {string} Descripción en español, ej: "Despejado".
 */
export function traducirWeatherCode(codigo) {
  return DESCRIPCIONES_CLIMA[codigo] ?? 'Condición desconocida';
}

/**
 * formatearTemperatura(temperatura)
 * -----------------------------------
 * Redondea la temperatura a 1 decimal y le agrega el símbolo de grados.
 *
 * @param {number} temperatura
 * @returns {string} Ej: "21.5 °C"
 */
export function formatearTemperatura(temperatura) {
  const redondeada = Math.round(temperatura * 10) / 10;
  return `${redondeada} °C`;
}