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
 * obtenerClimaDeCache(lat, lon)
 * --------------------------------
 * Devuelve los datos de clima guardados para esas coordenadas,
 * SOLO si todavía están vigentes (menos de 1 hora de antigüedad).
 * Si expiraron o no existen, devuelve `null` y limpia la entrada vieja.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {{ temperatura: number, weathercode: number } | null}
 */
export function obtenerClimaDeCache(lat, lon) {
  const clave = generarClave(lat, lon);
  const entrada = leerValor(clave);

  if (!entrada) return null;

  const antiguedadMs = Date.now() - entrada.timestamp;
  if (antiguedadMs > DURACION_CACHE_MS) {
    eliminarValor(clave); // expiró: la limpiamos para no dejar basura
    return null;
  }

  return entrada.datos;
}

/**
 * guardarClimaEnCache(lat, lon, datos)
 * ---------------------------------------
 * Guarda los datos de clima junto con la marca de tiempo actual.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {{ temperatura: number, weathercode: number }} datos
 */
export function guardarClimaEnCache(lat, lon, datos) {
  const clave = generarClave(lat, lon);
  guardarValor(clave, { datos, timestamp: Date.now() });
}