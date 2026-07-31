/**
 * api.js
 * -----------------------------------------------------------------
 * Este archivo se encarga de "hablar" con las APIs externas.
 * Ningún otro archivo debería usar fetch() directamente.
 *
 * CAMBIOS DE LA VERSIÓN DEPURADA:
 *   - Se separó la búsqueda de ciudad (buscarCiudades) del clima
 *     (obtenerClimaPorCoordenadas), porque ahora podemos recibir
 *     VARIAS coincidencias (ej. "Córdoba" -> España o Argentina)
 *     y dejar que el usuario elija, en vez de tomar la primera a ciegas.
 *   - Ambas funciones aceptan una AbortSignal opcional, para poder
 *     cancelar peticiones viejas si el usuario busca de nuevo antes
 *     de que la anterior termine (evita condiciones de carrera).
 *   - El clima por coordenadas ahora usa caché (ver cache.js): si ya
 *     se consultó esa ubicación hace menos de 1 hora, se devuelve el
 *     resultado guardado en vez de repetir la petición a la API.
 * -----------------------------------------------------------------
 */

import { obtenerClimaDeCache, guardarClimaEnCache } from './cache.js';

const URL_GEOCODIFICACION = 'https://geocoding-api.open-meteo.com/v1/search';
const URL_CLIMA = 'https://api.open-meteo.com/v1/forecast';

/**
 * buscarCiudades(nombre, signal)
 * -------------------------------
 * Busca todas las ciudades que coincidan con el nombre escrito
 * (hasta 5), en vez de asumir que la primera es la correcta.
 *
 * @param {string} nombre
 * @param {AbortSignal} [signal] - Para poder cancelar la petición.
 * @returns {Promise<Array<{ ciudad: string, pais: string, lat: number, lon: number }>>}
 */
export async function buscarCiudades(nombre, signal) {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) {
    throw new Error('Debes escribir el nombre de una ciudad.');
  }

  const url = `${URL_GEOCODIFICACION}?name=${encodeURIComponent(nombreLimpio)}&count=5&language=es&format=json`;

  let respuesta;
  try {
    respuesta = await fetch(url, { signal });
  } catch (error) {
    // Si la petición fue cancelada a propósito (nueva búsqueda encima),
    // relanzamos el error tal cual para que quien llama lo identifique
    // y NO lo muestre como un error real al usuario.
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servicio de geocodificación. Revisa tu conexión.');
  }

  if (!respuesta.ok) {
    throw new Error('No se pudo consultar el servicio de geocodificación.');
  }

  const datos = await respuesta.json();

  if (!datos.results || datos.results.length === 0) {
    throw new Error(`No se encontró la ciudad "${nombreLimpio}". Verifica el nombre e intenta de nuevo.`);
  }

  // Mapeamos cada resultado a la forma que usa el resto de la app
  return datos.results.map((resultado) => ({
    ciudad: resultado.name,
    pais: resultado.country ?? '',
    lat: resultado.latitude,
    lon: resultado.longitude,
  }));
}

/**
 * obtenerClimaPorCoordenadas(lat, lon, signal)
 * ---------------------------------------------
 * Dado un par de coordenadas, devuelve el clima actual.
 *
 * Antes de consultar la API, revisa si ya hay un resultado en caché
 * (válido por 1 hora) para esas coordenadas. Si lo hay, lo devuelve
 * de inmediato sin gastar una petición de red.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ temperatura: number, weathercode: number, desdeCache: boolean }>}
 */
export async function obtenerClimaPorCoordenadas(lat, lon, signal) {
  // --- Paso 0: ¿ya tenemos esto guardado y sigue vigente? ---
  const climaCacheado = obtenerClimaDeCache(lat, lon);
  if (climaCacheado) {
    return { ...climaCacheado, desdeCache: true };
  }

  const url = `${URL_CLIMA}?latitude=${lat}&longitude=${lon}&current_weather=true`;

  let respuesta;
  try {
    respuesta = await fetch(url, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servicio del clima. Revisa tu conexión.');
  }

  if (!respuesta.ok) {
    throw new Error('No se pudo consultar el servicio del clima.');
  }

  const datos = await respuesta.json();

  if (!datos.current_weather) {
    throw new Error('La API no devolvió información del clima actual.');
  }

  const resultado = {
    temperatura: datos.current_weather.temperature,
    weathercode: datos.current_weather.weathercode,
  };

  // Guardamos en caché para futuras consultas de esta misma ubicación
  guardarClimaEnCache(lat, lon, resultado);

  return { ...resultado, desdeCache: false };
}

/**
 * obtenerClima(ciudad, signal)
 * ------------------------------
 * Función de conveniencia para el caso simple: busca la ciudad y,
 * SI HAY UNA SOLA COINCIDENCIA, devuelve directamente su clima.
 * Si hay varias coincidencias, lanza un error especial `CiudadAmbiguaError`
 * con la lista de opciones, para que main.js/ui.js le pregunten al usuario.
 *
 * @param {string} ciudad
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ ciudad: string, temperatura: number, weathercode: number, desdeCache: boolean }>}
 */
export async function obtenerClima(ciudad, signal) {
  const opciones = await buscarCiudades(ciudad, signal);

  if (opciones.length > 1) {
    throw new CiudadAmbiguaError(opciones);
  }

  const [unica] = opciones;
  const clima = await obtenerClimaPorCoordenadas(unica.lat, unica.lon, signal);

  return {
    ciudad: unica.pais ? `${unica.ciudad}, ${unica.pais}` : unica.ciudad,
    temperatura: clima.temperatura,
    weathercode: clima.weathercode,
    desdeCache: clima.desdeCache,
  };
}

/**
 * Error personalizado para el caso "hay más de una ciudad con ese nombre".
 * Lleva las opciones adentro para que la UI pueda mostrarlas.
 */
export class CiudadAmbiguaError extends Error {
  constructor(opciones) {
    super('Hay varias ciudades con ese nombre. Elige una.');
    this.name = 'CiudadAmbiguaError';
    this.opciones = opciones;
  }
}