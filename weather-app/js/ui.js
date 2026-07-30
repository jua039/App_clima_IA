/**
 * ui.js
 * -----------------------------------------------------------------
 * Único archivo que toca el DOM.
 *
 * CAMBIOS DE LA VERSIÓN DEPURADA:
 *   - Nueva función mostrarOpcionesCiudad() para el caso de ciudades
 *     ambiguas (ej. "Córdoba"): en vez de adivinar, se le muestran
 *     las opciones al usuario y él elige.
 * -----------------------------------------------------------------
 */

import { traducirWeatherCode, formatearTemperatura } from './utils.js';

const contenedorResultado = document.getElementById('resultado');

export function mostrarCargando() {
  contenedorResultado.innerHTML = `
    <div class="estado estado--cargando">
      <span class="spinner" aria-hidden="true"></span>
      <p>Buscando el clima...</p>
    </div>
  `;
}

export function mostrarClima(datosClima) {
  const { ciudad, temperatura, weathercode } = datosClima;

  const descripcion = traducirWeatherCode(weathercode);
  const temperaturaTexto = formatearTemperatura(temperatura);

  contenedorResultado.innerHTML = `
    <article class="clima">
      <p class="clima__ciudad">${ciudad}</p>
      <p class="clima__temperatura">${temperaturaTexto}</p>
      <p class="clima__descripcion">${descripcion}</p>
    </article>
  `;
}

export function mostrarError(mensaje) {
  contenedorResultado.innerHTML = `
    <div class="estado estado--error" role="alert">
      <span aria-hidden="true">⚠️</span>
      <p>${mensaje}</p>
    </div>
  `;
}

export function limpiarPantalla() {
  contenedorResultado.innerHTML = `
    <p class="placeholder">Escribe una ciudad para ver su clima.</p>
  `;
}

/**
 * mostrarOpcionesCiudad(opciones, alElegir)
 * -------------------------------------------
 * Muestra una lista de botones, uno por cada ciudad candidata,
 * cuando el nombre buscado es ambiguo (ej. varias "Córdoba").
 *
 * @param {Array<{ ciudad: string, pais: string, lat: number, lon: number }>} opciones
 * @param {(opcion: { ciudad: string, pais: string, lat: number, lon: number }) => void} alElegir
 *        Función que se ejecuta cuando el usuario hace clic en una opción.
 */
export function mostrarOpcionesCiudad(opciones, alElegir) {
  const botones = opciones
    .map((opcion, indice) => {
      const etiqueta = opcion.pais ? `${opcion.ciudad}, ${opcion.pais}` : opcion.ciudad;
      // Guardamos el índice en un data-attribute para saber cuál se eligió
      return `<button type="button" class="opcion-ciudad" data-indice="${indice}">${etiqueta}</button>`;
    })
    .join('');

  contenedorResultado.innerHTML = `
    <div class="estado estado--opciones">
      <p>Encontramos varias ciudades. ¿Cuál buscabas?</p>
      <div class="opciones-ciudad">${botones}</div>
    </div>
  `;

  // Conectamos el clic de cada botón con la función que nos pasaron
  contenedorResultado.querySelectorAll('.opcion-ciudad').forEach((boton) => {
    boton.addEventListener('click', () => {
      const indice = Number(boton.dataset.indice);
      alElegir(opciones[indice]);
    });
  });
}

/**
 * establecerBotonCargando(boton, estaCargando)
 * -----------------------------------------------
 * Deshabilita el botón de búsqueda mientras hay una petición en curso,
 * para evitar que el usuario dispare varias búsquedas en paralelo
 * con clics repetidos.
 *
 * @param {HTMLButtonElement} boton
 * @param {boolean} estaCargando
 */
export function establecerBotonCargando(boton, estaCargando) {
  boton.disabled = estaCargando;
  boton.textContent = estaCargando ? 'Buscando…' : 'Buscar';
}