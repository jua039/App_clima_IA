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
 * Tabla que traduce cada "weathercode" a un ícono (emoji) representativo.
 * Se usa junto con traducirWeatherCode() para que la interfaz no dependa
 * solo de texto: un ícono se reconoce de un vistazo.
 */
const ICONOS_CLIMA = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌧️',
  56: '🌧️',
  57: '🌧️',
  61: '🌦️',
  63: '🌧️',
  65: '🌧️',
  66: '🌧️',
  67: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '❄️',
  77: '❄️',
  80: '🌦️',
  81: '🌧️',
  82: '⛈️',
  85: '🌨️',
  86: '❄️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

/**
 * iconoWeatherCode(codigo)
 * ---------------------------
 * Devuelve un emoji representativo del weathercode, para reforzar
 * visualmente la descripción en texto.
 *
 * @param {number} codigo
 * @returns {string} Ej: "☀️"
 */
export function iconoWeatherCode(codigo) {
  return ICONOS_CLIMA[codigo] ?? '🌡️';
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

/**
 * formatearHumedad(humedad)
 * ----------------------------
 * @param {number} humedad - Porcentaje (0-100).
 * @returns {string} Ej: "64%"
 */
export function formatearHumedad(humedad) {
  if (humedad === null || humedad === undefined) return '—';
  return `${Math.round(humedad)}%`;
}

/**
 * formatearViento(velocidadKmh)
 * ---------------------------------
 * @param {number} velocidadKmh
 * @returns {string} Ej: "18 km/h"
 */
export function formatearViento(velocidadKmh) {
  if (velocidadKmh === null || velocidadKmh === undefined) return '—';
  return `${Math.round(velocidadKmh)} km/h`;
}

/**
 * formatearPrecipitacion(mm)
 * ------------------------------
 * @param {number} mm - Milímetros de precipitación.
 * @returns {string} Ej: "2.4 mm" o "Sin lluvia"
 */
export function formatearPrecipitacion(mm) {
  if (mm === null || mm === undefined) return '—';
  if (mm === 0) return 'Sin lluvia';
  return `${Math.round(mm * 10) / 10} mm`;
}

/**
 * formatearDiaSemana(fechaISO, indice)
 * ----------------------------------------
 * Convierte una fecha "YYYY-MM-DD" (como las que devuelve Open-Meteo)
 * en una etiqueta corta en español: "Hoy", "Mañana" o el día de la
 * semana abreviado ("lun.", "mar.", ...).
 *
 * @param {string} fechaISO
 * @param {number} indice - Posición dentro del pronóstico (0 = primer día).
 * @returns {string}
 */
export function formatearDiaSemana(fechaISO, indice) {
  if (indice === 0) return 'Hoy';
  if (indice === 1) return 'Mañana';
  const fecha = new Date(`${fechaISO}T00:00:00`);
  const etiqueta = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
  return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
}