/**
 * main.js
 * -----------------------------------------------------------------
 * Director de orquesta de la app.
 *
 * CAMBIOS DE ESTA VERSIÓN:
 *   1) Pronóstico de 5 días: tras mostrar el clima de una ciudad,
 *      aparece un botón para cargarlo bajo demanda.
 *   2) Modo "Comparar ciudades": el usuario escribe varias ciudades
 *      separadas por coma y ve el clima de todas en tarjetas.
 *   3) Pestañas para alternar entre ambos modos, recordando la
 *      pestaña activa no es necesario (siempre se abre en "Clima
 *      actual"), pero sí se recuerda el texto de cada input.
 * -----------------------------------------------------------------
 */

import {
  obtenerClimaPorCoordenadas,
  obtenerPronostico5Dias,
  obtenerClimaDeVariasCiudades,
  buscarCiudades,
  CiudadAmbiguaError,
} from './api.js';
import {
  guardarUltimaCiudadBuscada,
  obtenerUltimaCiudadBuscada,
  guardarUltimasCiudadesComparadas,
  obtenerUltimasCiudadesComparadas,
} from './cache.js';
import {
  mostrarCargando,
  mostrarCargandoPronostico,
  mostrarClima,
  mostrarPronostico,
  mostrarError,
  mostrarOpcionesCiudad,
  mostrarComparacion,
  establecerBotonCargando,
  cambiarPestana,
} from './ui.js';

const inputCiudad = document.getElementById('ciudad');
const botonBuscar = document.getElementById('buscar');
const inputCiudadesComparar = document.getElementById('ciudades-comparar');
const botonComparar = document.getElementById('comparar');
const pestanas = document.querySelectorAll('.pestana');

// Coordenadas de la última ciudad mostrada, para poder pedir su
// pronóstico de 5 días sin tener que volver a geocodificarla.
let ultimaCoordenadaMostrada = null;

// Controladores para poder cancelar búsquedas en curso (uno para el
// modo individual, otro para el comparativo: son independientes).
let controladorIndividual = null;
let controladorComparar = null;

/**
 * buscarClima()
 * Se ejecuta cuando el usuario quiere consultar el clima de UNA
 * ciudad (clic en "Buscar" o Enter en el input individual).
 */
async function buscarClima() {
  const ciudad = inputCiudad.value;
  guardarUltimaCiudadBuscada(ciudad);

  if (controladorIndividual) {
    controladorIndividual.abort();
  }
  controladorIndividual = new AbortController();
  const { signal } = controladorIndividual;

  mostrarCargando();
  establecerBotonCargando(botonBuscar, true);

  try {
    const opciones = await buscarCiudades(ciudad, signal);

    if (opciones.length === 1) {
      await mostrarClimaDeOpcion(opciones[0], signal);
    } else {
      mostrarOpcionesCiudad(opciones, (opcionElegida) => {
        mostrarClimaDeOpcion(opcionElegida, signal);
      });
    }
  } catch (error) {
    manejarError(error);
  } finally {
    if (controladorIndividual?.signal === signal) {
      establecerBotonCargando(botonBuscar, false);
    }
  }
}

/**
 * mostrarClimaDeOpcion(opcion, signal)
 * Dada una ciudad ya elegida (sin ambigüedad), pide su clima y lo
 * muestra, dejando lista la opción de pedir el pronóstico de 5 días.
 */
async function mostrarClimaDeOpcion(opcion, signal) {
  try {
    establecerBotonCargando(botonBuscar, true);
    const clima = await obtenerClimaPorCoordenadas(opcion.lat, opcion.lon, signal);
    const nombreCompleto = opcion.pais ? `${opcion.ciudad}, ${opcion.pais}` : opcion.ciudad;

    ultimaCoordenadaMostrada = { lat: opcion.lat, lon: opcion.lon, nombre: nombreCompleto };

    mostrarClima(
      { ciudad: nombreCompleto, ...clima },
      () => pedirPronostico(opcion.lat, opcion.lon, signal)
    );
  } catch (error) {
    manejarError(error);
  } finally {
    establecerBotonCargando(botonBuscar, false);
  }
}

/**
 * pedirPronostico(lat, lon, signal)
 * Carga y muestra el pronóstico de 5 días para las coordenadas dadas.
 * Se dispara al hacer clic en el botón "Ver pronóstico de 5 días".
 */
async function pedirPronostico(lat, lon, signal) {
  mostrarCargandoPronostico();
  try {
    const { dias } = await obtenerPronostico5Dias(lat, lon, signal);
    mostrarPronostico(dias);
  } catch (error) {
    if (error.name === 'AbortError') return;
    mostrarError(error.message);
  }
}

/**
 * manejarError(error)
 * Centraliza cómo reaccionamos a los distintos tipos de error.
 */
function manejarError(error) {
  if (error.name === 'AbortError') {
    return;
  }

  if (error instanceof CiudadAmbiguaError) {
    mostrarOpcionesCiudad(error.opciones, (opcionElegida) => {
      mostrarClimaDeOpcion(opcionElegida, controladorIndividual.signal);
    });
    return;
  }

  mostrarError(error.message);
}

/**
 * compararClimas()
 * Se ejecuta cuando el usuario quiere comparar VARIAS ciudades a la
 * vez (clic en "Comparar" o Enter en el input de comparación).
 */
async function compararClimas() {
  const textoCiudades = inputCiudadesComparar.value;
  guardarUltimasCiudadesComparadas(textoCiudades);

  const nombresCiudades = textoCiudades
    .split(',')
    .map((nombre) => nombre.trim())
    .filter(Boolean);

  if (nombresCiudades.length === 0) {
    mostrarError('Escribe al menos una ciudad (separa varias con comas).', document.getElementById('resultado-comparar'));
    return;
  }

  if (controladorComparar) {
    controladorComparar.abort();
  }
  controladorComparar = new AbortController();
  const { signal } = controladorComparar;

  mostrarCargando(document.getElementById('resultado-comparar'));
  establecerBotonCargando(botonComparar, true, 'Comparando…', 'Comparar');

  try {
    const resultados = await obtenerClimaDeVariasCiudades(nombresCiudades, signal);
    mostrarComparacion(resultados);
  } catch (error) {
    if (error.name === 'AbortError') return;
    mostrarError(error.message, document.getElementById('resultado-comparar'));
  } finally {
    if (controladorComparar?.signal === signal) {
      establecerBotonCargando(botonComparar, false, 'Comparando…', 'Comparar');
    }
  }
}

// --- Modo individual ---
botonBuscar.addEventListener('click', buscarClima);
inputCiudad.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') buscarClima();
});

// --- Modo comparativo ---
botonComparar.addEventListener('click', compararClimas);
inputCiudadesComparar.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') compararClimas();
});

// --- Pestañas ---
pestanas.forEach((pestana) => {
  pestana.addEventListener('click', () => cambiarPestana(pestana.dataset.pestana));
});

// --- Al cargar la página: restauramos lo último escrito en cada input ---
const ultimaCiudad = obtenerUltimaCiudadBuscada();
if (ultimaCiudad) {
  inputCiudad.value = ultimaCiudad;
}

const ultimasCiudadesComparadas = obtenerUltimasCiudadesComparadas();
if (ultimasCiudadesComparadas) {
  inputCiudadesComparar.value = ultimasCiudadesComparadas;
}