/**
 * main.js
 * -----------------------------------------------------------------
 * Director de orquesta de la app.
 *
 * CAMBIOS DE LA VERSIÓN DEPURADA:
 *   1) Botón deshabilitado mientras carga (evita doble envío).
 *   2) AbortController: si el usuario busca de nuevo antes de que
 *      termine la búsqueda anterior, esa búsqueda vieja se cancela
 *      en vez de dejar que ambas respuestas compitan (race condition).
 *   3) Manejo de CiudadAmbiguaError: si hay varias ciudades con el
 *      mismo nombre, se le pide al usuario que elija una.
 * -----------------------------------------------------------------
 */

import { obtenerClimaPorCoordenadas, buscarCiudades, CiudadAmbiguaError } from './api.js';
import {
  mostrarCargando,
  mostrarClima,
  mostrarError,
  mostrarOpcionesCiudad,
  establecerBotonCargando,
} from './ui.js';

const inputCiudad = document.getElementById('ciudad');
const botonBuscar = document.getElementById('buscar');

// Guardamos aquí el "controlador" de la búsqueda en curso, para poder
// cancelarla si el usuario dispara una nueva antes de que termine.
let controladorActual = null;

/**
 * buscarClima()
 * Se ejecuta cuando el usuario quiere consultar el clima
 * (clic en el botón o Enter en el input).
 */
async function buscarClima() {
  const ciudad = inputCiudad.value;

  // --- Paso 1: cancelar cualquier búsqueda anterior todavía en curso ---
  if (controladorActual) {
    controladorActual.abort();
  }
  controladorActual = new AbortController();
  const { signal } = controladorActual;

  mostrarCargando();
  establecerBotonCargando(botonBuscar, true);

  try {
    const opciones = await buscarCiudades(ciudad, signal);

    if (opciones.length === 1) {
      await mostrarClimaDeOpcion(opciones[0], signal);
    } else {
      // Varias coincidencias: dejamos que el usuario elija
      mostrarOpcionesCiudad(opciones, (opcionElegida) => {
        mostrarClimaDeOpcion(opcionElegida, signal);
      });
    }
  } catch (error) {
    manejarError(error);
  } finally {
    // Solo "apagamos" el estado de carga si esta sigue siendo la
    // búsqueda vigente (no una vieja que fue cancelada)
    if (controladorActual?.signal === signal) {
      establecerBotonCargando(botonBuscar, false);
    }
  }
}

/**
 * mostrarClimaDeOpcion(opcion, signal)
 * Dada una ciudad ya elegida (sin ambigüedad), pide su clima y lo muestra.
 */
async function mostrarClimaDeOpcion(opcion, signal) {
  try {
    establecerBotonCargando(botonBuscar, true);
    const clima = await obtenerClimaPorCoordenadas(opcion.lat, opcion.lon, signal);

    mostrarClima({
      ciudad: opcion.pais ? `${opcion.ciudad}, ${opcion.pais}` : opcion.ciudad,
      temperatura: clima.temperatura,
      weathercode: clima.weathercode,
      desdeCache: clima.desdeCache,
    });
  } catch (error) {
    manejarError(error);
  } finally {
    establecerBotonCargando(botonBuscar, false);
  }
}

/**
 * manejarError(error)
 * Centraliza cómo reaccionamos a los distintos tipos de error.
 */
function manejarError(error) {
  // Una búsqueda cancelada a propósito (por una búsqueda más nueva)
  // NO es un error real: simplemente no hacemos nada y dejamos que
  // la búsqueda nueva tome el control de la pantalla.
  if (error.name === 'AbortError') {
    return;
  }

  if (error instanceof CiudadAmbiguaError) {
    mostrarOpcionesCiudad(error.opciones, (opcionElegida) => {
      mostrarClimaDeOpcion(opcionElegida, controladorActual.signal);
    });
    return;
  }

  mostrarError(error.message);
}

// Evento 1: clic en el botón "Buscar"
botonBuscar.addEventListener('click', buscarClima);

// Evento 2: tecla Enter dentro del input
inputCiudad.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    buscarClima();
  }
});