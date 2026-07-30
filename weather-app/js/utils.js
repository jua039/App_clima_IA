/**
 * utils.js
 * Funciones auxiliares puras (sin efectos secundarios ni acceso al DOM).
 * Se encargan de traducir datos "crudos" de la API a algo legible para humanos.
 */

/**
 * Formatea un valor numérico de temperatura a un string legible.
 * @param {number} temp - Temperatura en grados.
 * @param {string} unit - Símbolo de la unidad (por defecto Celsius).
 * @returns {string} Ej: "21.5 °C"
 */
export function formatTemperature(temp, unit = '°C') {
  // Redondeamos a 1 decimal para mantener consistencia visual
  const rounded = Math.round(temp * 10) / 10;
  return `${rounded} ${unit}`;
}

/**
 * Tabla de mapeo de códigos WMO (weather code) que usa Open-Meteo
 * a una descripción en español y un ícono representativo (emoji).
 * Referencia: https://open-meteo.com/en/docs (sección "WMO Weather interpretation codes")
 */
const WEATHER_CODE_MAP = {
  0: { text: 'Cielo despejado', icon: '☀️' },
  1: { text: 'Mayormente despejado', icon: '🌤️' },
  2: { text: 'Parcialmente nublado', icon: '⛅' },
  3: { text: 'Nublado', icon: '☁️' },
  45: { text: 'Niebla', icon: '🌫️' },
  48: { text: 'Niebla con escarcha', icon: '🌫️' },
  51: { text: 'Llovizna ligera', icon: '🌦️' },
  53: { text: 'Llovizna moderada', icon: '🌦️' },
  55: { text: 'Llovizna intensa', icon: '🌧️' },
  56: { text: 'Llovizna helada ligera', icon: '🌧️' },
  57: { text: 'Llovizna helada intensa', icon: '🌧️' },
  61: { text: 'Lluvia ligera', icon: '🌧️' },
  63: { text: 'Lluvia moderada', icon: '🌧️' },
  65: { text: 'Lluvia intensa', icon: '🌧️' },
  66: { text: 'Lluvia helada ligera', icon: '🌧️' },
  67: { text: 'Lluvia helada intensa', icon: '🌧️' },
  71: { text: 'Nevada ligera', icon: '🌨️' },
  73: { text: 'Nevada moderada', icon: '🌨️' },
  75: { text: 'Nevada intensa', icon: '❄️' },
  77: { text: 'Granos de nieve', icon: '❄️' },
  80: { text: 'Chubascos ligeros', icon: '🌦️' },
  81: { text: 'Chubascos moderados', icon: '🌧️' },
  82: { text: 'Chubascos violentos', icon: '⛈️' },
  85: { text: 'Chubascos de nieve ligeros', icon: '🌨️' },
  86: { text: 'Chubascos de nieve intensos', icon: '🌨️' },
  95: { text: 'Tormenta eléctrica', icon: '⛈️' },
  96: { text: 'Tormenta con granizo ligero', icon: '⛈️' },
  99: { text: 'Tormenta con granizo intenso', icon: '⛈️' },
};

/**
 * Traduce un weather code de Open-Meteo a { text, icon }.
 * Si el código no está en la tabla, devuelve un valor genérico en vez de fallar.
 * @param {number} code
 * @returns {{text: string, icon: string}}
 */
export function getWeatherDescription(code) {
  return WEATHER_CODE_MAP[code] ?? { text: 'Condición desconocida', icon: '❔' };
}