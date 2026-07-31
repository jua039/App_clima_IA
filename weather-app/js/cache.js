/**
 * cache.js
 * -----------------------------------------------------------------
 * Cachea los resultados de clima (por coordenadas) durante 1 hora,
 * para no repetir peticiones innecesarias a la API si el usuario
 * vuelve a consultar la misma ubicación en ese lapso.
 *
 * DISEÑO MULTIPLATAFORMA:
 *   Se intenta usar `localStorage` (disponible en navegadores),
 *   pero si no existe o está bloqueado (algunos WebViews embebidos,
 *   modo privado muy restrictivo, entornos sin `window`), se cae
 *   automáticamente a un `Map` en memoria. El resto de la app no
 *   necesita saber cuál de los dos se está usando: solo llama a
 *   `obtenerClimaDeCache()` / `guardarClimaEnCache()`.
 *
 *   Nota: el respaldo en memoria vive únicamente mientras la pestaña
 *   está abierta (se pierde al recargar), mientras que localStorage
 *   persiste entre sesiones. Ambos respetan el mismo límite de 1 hora.
 * -----------------------------------------------------------------
 */

const DURACION_CACHE_MS = 60 * 60 * 1000; // 1 hora
const PREFIJO_CLAVE = 'clima_cache_';

// Respaldo en memoria, usado solo si localStorage no está disponible
const almacenamientoEnMemoria = new Map();

/**
 * Comprueba, una sola vez, si localStorage está disponible y utilizable
 * en este entorno (puede fallar por permisos, modo privado, o porque
 * el código corre en un contexto sin `window`, como pruebas en Node).
 */
function hayLocalStorageDisponible() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const claveDePrueba = '__cache_test__';
    window.localStorage.setItem(claveDePrueba, '1');
    window.localStorage.removeItem(claveDePrueba);
    return true;
  } catch {
    return false;
  }
}

const usarLocalStorage = hayLocalStorageDisponible();

function guardarValor(clave, valor) {
  const serializado = JSON.stringify(valor);
  if (usarLocalStorage) {
    window.localStorage.setItem(clave, serializado);
  } else {
    almacenamientoEnMemoria.set(clave, serializado);
  }
}

function leerValor(clave) {
  const serializado = usarLocalStorage
    ? window.localStorage.getItem(clave)
    : almacenamientoEnMemoria.get(clave);

  if (!serializado) return null;

  try {
    return JSON.parse(serializado);
  } catch {
    // Si el valor guardado está corrupto, lo tratamos como si no existiera
    return null;
  }
}

function eliminarValor(clave) {
  if (usarLocalStorage) {
    window.localStorage.removeItem(clave);
  } else {
    almacenamientoEnMemoria.delete(clave);
  }
}

/**
 * Genera una clave de caché a partir de las coordenadas, redondeadas
 * a 2 decimales (~1 km de precisión). Así, pequeñas variaciones de
 * geocodificación para la "misma" ciudad comparten la misma entrada.
 */
function generarClave(lat, lon) {
  return `${PREFIJO_CLAVE}${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

/**
 * obtenerDeCache(clave, duracionMs)
 * -------------------------------------
 * Función GENÉRICA de lectura: devuelve lo guardado bajo `clave`
 * solo si todavía está vigente (más nuevo que `duracionMs`).
 * Si expiró o no existe, devuelve `null` y limpia la entrada vieja.
 *
 * Es la base sobre la que se construyen las funciones específicas
 * de más abajo (clima actual, pronóstico, etc.), para no repetir la
 * lógica de expiración en cada una.
 *
 * @param {string} clave
 * @param {number} [duracionMs] - Antigüedad máxima permitida (por defecto 1 hora).
 * @returns {*} Los datos guardados, o `null` si no hay nada vigente.
 */
export function obtenerDeCache(clave, duracionMs = DURACION_CACHE_MS) {
  const entrada = leerValor(clave);
  if (!entrada) return null;

  const antiguedadMs = Date.now() - entrada.timestamp;
  if (antiguedadMs > duracionMs) {
    eliminarValor(clave); // expiró: la limpiamos para no dejar basura
    return null;
  }

  return entrada.datos;
}

/**
 * guardarEnCache(clave, datos)
 * ---------------------------------
 * Función GENÉRICA de escritura: guarda `datos` bajo `clave` junto
 * con la marca de tiempo actual, para que obtenerDeCache() pueda
 * calcular después si sigue vigente.
 *
 * @param {string} clave
 * @param {*} datos
 */
export function guardarEnCache(clave, datos) {
  guardarValor(clave, { datos, timestamp: Date.now() });
}

/**
 * obtenerClimaDeCache(lat, lon)
 * --------------------------------
 * Devuelve los datos de clima actual guardados para esas coordenadas,
 * si aún son válidos (menos de 1 hora de antigüedad).
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {object | null}
 */
export function obtenerClimaDeCache(lat, lon) {
  return obtenerDeCache(generarClave(lat, lon));
}

/**
 * guardarClimaEnCache(lat, lon, datos)
 * ---------------------------------------
 * Guarda los datos de clima actual junto con la marca de tiempo actual.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {object} datos
 */
export function guardarClimaEnCache(lat, lon, datos) {
  guardarEnCache(generarClave(lat, lon), datos);
}

/**
 * obtenerPronosticoDeCache(lat, lon) / guardarPronosticoEnCache(lat, lon, datos)
 * -----------------------------------------------------------------------------
 * Igual que las funciones de clima actual, pero para el pronóstico de
 * 5 días, usando una clave distinta (prefijo "pronostico_") para no
 * pisar el caché del clima actual de la misma ciudad.
 */
function generarClavePronostico(lat, lon) {
  return `${PREFIJO_CLAVE}pronostico_${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

export function obtenerPronosticoDeCache(lat, lon) {
  return obtenerDeCache(generarClavePronostico(lat, lon));
}

export function guardarPronosticoEnCache(lat, lon, datos) {
  guardarEnCache(generarClavePronostico(lat, lon), datos);
}

// -----------------------------------------------------------------
// Última ciudad buscada: para que el input recuerde el texto al
// recargar la página. A diferencia del caché de clima, esto NO
// expira (no tiene sentido "olvidar" lo último que el usuario
// escribió solo porque pasó una hora).
// -----------------------------------------------------------------

const CLAVE_ULTIMA_CIUDAD = `${PREFIJO_CLAVE}ultima_ciudad`;

/**
 * guardarUltimaCiudadBuscada(nombreCiudad)
 * Guarda el texto que el usuario escribió en el input.
 * @param {string} nombreCiudad
 */
export function guardarUltimaCiudadBuscada(nombreCiudad) {
  guardarValor(CLAVE_ULTIMA_CIUDAD, nombreCiudad);
}

/**
 * obtenerUltimaCiudadBuscada()
 * Devuelve la última ciudad guardada, o null si nunca se buscó nada.
 * @returns {string | null}
 */
export function obtenerUltimaCiudadBuscada() {
  return leerValor(CLAVE_ULTIMA_CIUDAD);
}

// -----------------------------------------------------------------
// Última lista de ciudades comparadas (modo "Comparar ciudades"):
// igual que la última ciudad buscada, se recuerda sin expirar.
// -----------------------------------------------------------------

const CLAVE_ULTIMAS_CIUDADES_COMPARADAS = `${PREFIJO_CLAVE}ultimas_ciudades_comparadas`;

/**
 * guardarUltimasCiudadesComparadas(textoCiudades)
 * @param {string} textoCiudades - Texto tal cual lo escribió el usuario.
 */
export function guardarUltimasCiudadesComparadas(textoCiudades) {
  guardarValor(CLAVE_ULTIMAS_CIUDADES_COMPARADAS, textoCiudades);
}

/**
 * obtenerUltimasCiudadesComparadas()
 * @returns {string | null}
 */
export function obtenerUltimasCiudadesComparadas() {
  return leerValor(CLAVE_ULTIMAS_CIUDADES_COMPARADAS);
}