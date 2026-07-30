/**
 * api.js
 * Toda la comunicación con las APIs externas de Open-Meteo vive aquí.
 * Ningún otro módulo debería llamar a fetch() directamente.
 */

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Error personalizado para poder distinguir "ciudad no encontrada"
 * de otros errores (red, API caída, etc.) en la capa de UI.
 */
export class CityNotFoundError extends Error {
  constructor(cityName) {
    super(`No se encontró la ciudad "${cityName}".`);
    this.name = 'CityNotFoundError';
  }
}

/**
 * Convierte el nombre de una ciudad en coordenadas (lat/lon)
 * usando la API de Geocodificación de Open-Meteo.
 * @param {string} cityName
 * @returns {Promise<{ lat: number, lon: number, name: string, country: string }>}
 */
async function getCoordinates(cityName) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=es&format=json`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    // Error de red (sin conexión, DNS, CORS bloqueado, etc.)
    throw new Error('No se pudo conectar con el servicio de geocodificación. Revisa tu conexión.');
  }

  if (!response.ok) {
    throw new Error(`Error del servicio de geocodificación (código ${response.status}).`);
  }

  const data = await response.json();

  // Si no hay resultados, la API devuelve "results" undefined o vacío
  if (!data.results || data.results.length === 0) {
    throw new CityNotFoundError(cityName);
  }

  const [first] = data.results;
  return {
    lat: first.latitude,
    lon: first.longitude,
    name: first.name,
    country: first.country ?? '',
  };
}

/**
 * Consulta el clima actual para unas coordenadas dadas.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ temperature: number, weatherCode: number, windSpeed: number }>}
 */
async function getCurrentWeather(lat, lon) {
  const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('No se pudo conectar con el servicio del clima. Revisa tu conexión.');
  }

  if (!response.ok) {
    throw new Error(`Error del servicio del clima (código ${response.status}).`);
  }

  const data = await response.json();

  if (!data.current_weather) {
    throw new Error('La respuesta de la API no incluyó datos de clima actual.');
  }

  return {
    temperature: data.current_weather.temperature,
    weatherCode: data.current_weather.weathercode,
    windSpeed: data.current_weather.windspeed,
  };
}

/**
 * Función principal que orquesta geocodificación + clima.
 * Es la única función que main.js necesita llamar.
 * @param {string} cityName
 * @returns {Promise<{ city: string, country: string, temperature: number, weatherCode: number, windSpeed: number }>}
 */
export async function fetchWeatherByCity(cityName) {
  const trimmedName = cityName.trim();

  if (!trimmedName) {
    throw new Error('Por favor escribe el nombre de una ciudad.');
  }

  const { lat, lon, name, country } = await getCoordinates(trimmedName);
  const weather = await getCurrentWeather(lat, lon);

  return {
    city: name,
    country,
    temperature: weather.temperature,
    weatherCode: weather.weatherCode,
    windSpeed: weather.windSpeed,
  };
}