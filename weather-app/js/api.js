
/**
 * api.js
 * -----------------------------------------------------------------
 * Este archivo se encarga de "hablar" con las APIs externas.
 * Ningún otro archivo debería usar fetch() directamente.
 *
 * CAMBIOS DE ESTA VERSIÓN:
 *   - El clima actual ahora pide también humedad, velocidad del
 *     viento y precipitación (antes solo traía temperatura).
 *   - Nueva función obtenerPronostico5Dias() para el pronóstico
 *     extendido, también con caché de 1 hora.
 *   - Nueva función obtenerClimaDeVariasCiudades() para el modo
 *     comparativo: recibe varios nombres de ciudad y devuelve el
 *     clima de cada una (o el motivo por el que falló), sin que un
 *     error en una ciudad tumbe la consulta de las demás.
 * -----------------------------------------------------------------
 */

import {
  obtenerClimaDeCache,
  guardarClimaEnCache,
  obtenerPronosticoDeCache,
  guardarPronosticoEnCache,
} from './cache.js';

const URL_GEOCODIFICACION = 'https://geocoding-api.open-meteo.com/v1/search';
const URL_CLIMA = 'https://api.open-meteo.com/v1/forecast';

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

  return datos.results.map((resultado) => ({
    ciudad: resultado.name,
    pais: resultado.country ?? '',
    lat: resultado.latitude,
    lon: resultado.longitude,
  }));
}

export async function obtenerClimaPorCoordenadas(lat, lon, signal) {
  const climaCacheado = obtenerClimaDeCache(lat, lon);
  if (climaCacheado) {
    return { ...climaCacheado, desdeCache: true };
  }

  const variables = [
    'temperature_2m',
    'relative_humidity_2m',
    'precipitation',
    'weathercode',
    'wind_speed_10m',
  ].join(',');
  const url = `${URL_CLIMA}?latitude=${lat}&longitude=${lon}&current=${variables}&timezone=auto`;

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

  if (!datos.current) {
    throw new Error('La API no devolvió información del clima actual.');
  }

  const resultado = {
    temperatura: datos.current.temperature_2m,
    weathercode: datos.current.weathercode,
    humedad: datos.current.relative_humidity_2m,
    vientoKmh: datos.current.wind_speed_10m,
    precipitacionMm: datos.current.precipitation,
  };

  guardarClimaEnCache(lat, lon, resultado);

  return { ...resultado, desdeCache: false };
}

export async function obtenerPronostico5Dias(lat, lon, signal) {
  const pronosticoCacheado = obtenerPronosticoDeCache(lat, lon);
  if (pronosticoCacheado) {
    return { ...pronosticoCacheado, desdeCache: true };
  }

  const variablesDiarias = [
    'weathercode',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
  ].join(',');
  const url = `${URL_CLIMA}?latitude=${lat}&longitude=${lon}&daily=${variablesDiarias}&forecast_days=5&timezone=auto`;

  let respuesta;
  try {
    respuesta = await fetch(url, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servicio del clima. Revisa tu conexión.');
  }

  if (!respuesta.ok) {
    throw new Error('No se pudo consultar el pronóstico extendido.');
  }

  const datos = await respuesta.json();

  if (!datos.daily || !datos.daily.time) {
    throw new Error('La API no devolvió el pronóstico de los próximos días.');
  }

  const dias = datos.daily.time.map((fecha, indice) => ({
    fecha,
    tempMax: datos.daily.temperature_2m_max[indice],
    tempMin: datos.daily.temperature_2m_min[indice],
    weathercode: datos.daily.weathercode[indice],
    precipitacionMm: datos.daily.precipitation_sum[indice],
  }));

  const resultado = { dias };
  guardarPronosticoEnCache(lat, lon, resultado);

  return { ...resultado, desdeCache: false };
}

export async function obtenerClima(ciudad, signal) {
  const opciones = await buscarCiudades(ciudad, signal);

  if (opciones.length > 1) {
    throw new CiudadAmbiguaError(opciones);
  }

  const [unica] = opciones;
  const clima = await obtenerClimaPorCoordenadas(unica.lat, unica.lon, signal);

  return {
    ciudad: unica.pais ? `${unica.ciudad}, ${unica.pais}` : unica.ciudad,
    ...clima,
  };
}

export async function obtenerClimaDeVariasCiudades(nombresCiudades, signal) {
  const resultados = await Promise.allSettled(
    nombresCiudades.map(async (nombre) => {
      const opciones = await buscarCiudades(nombre, signal);
      const primera = opciones[0];
      const clima = await obtenerClimaPorCoordenadas(primera.lat, primera.lon, signal);
      return {
        nombreBuscado: nombre,
        ciudad: primera.pais ? `${primera.ciudad}, ${primera.pais}` : primera.ciudad,
        ...clima,
      };
    })
  );

  return resultados.map((resultado, indice) => {
    if (resultado.status === 'fulfilled') {
      return { ok: true, ...resultado.value };
    }
    if (resultado.reason?.name === 'AbortError') throw resultado.reason;
    return {
      ok: false,
      nombreBuscado: nombresCiudades[indice],
      mensaje: resultado.reason?.message ?? 'No se pudo obtener el clima de esta ciudad.',
    };
  });
}

export class CiudadAmbiguaError extends Error {
  constructor(opciones) {
    super('Hay varias ciudades con ese nombre. Elige una.');
    this.name = 'CiudadAmbiguaError';
    this.opciones = opciones;
  }
}