/**
 * ui.js
 * -----------------------------------------------------------------
 * Único archivo que toca el DOM.
 *
 * CAMBIOS DE ESTA VERSIÓN:
 *   - mostrarClima() ahora también pinta humedad, viento y
 *     precipitación, además de un ícono y un botón para pedir el
 *     pronóstico de 5 días.
 *   - Nueva mostrarPronostico() para el pronóstico extendido.
 *   - Nueva mostrarComparacion() para el modo de varias ciudades.
 *   - Nueva cambiarPestana() para alternar entre "Clima actual" y
 *     "Comparar ciudades".
 * -----------------------------------------------------------------
 */

import {
  traducirWeatherCode,
  iconoWeatherCode,
  formatearTemperatura,
  formatearHumedad,
  formatearViento,
  formatearPrecipitacion,
  formatearDiaSemana,
} from './utils.js';

const contenedorResultado = document.getElementById('resultado');
const contenedorPronostico = document.getElementById('pronostico');
const contenedorComparar = document.getElementById('resultado-comparar');
const pestanas = document.querySelectorAll('.pestana');
const paneles = document.querySelectorAll('.panel');

export function mostrarCargando(contenedor = contenedorResultado) {
  contenedor.innerHTML = `
    <div class="estado estado--cargando">
      <span class="spinner" aria-hidden="true"></span>
      <p>Buscando el clima...</p>
    </div>
  `;
}

/**
 * mostrarClima(datosClima, alPedirPronostico)
 * -----------------------------------------------
 * Pinta la tarjeta de clima actual con temperatura, descripción,
 * humedad, viento y precipitación. Si se pasa `alPedirPronostico`,
 * también muestra un botón para cargar el pronóstico de 5 días.
 *
 * @param {object} datosClima
 * @param {() => void} [alPedirPronostico]
 */
export function mostrarClima(datosClima, alPedirPronostico) {
  const { ciudad, temperatura, weathercode, humedad, vientoKmh, precipitacionMm, desdeCache } = datosClima;

  const descripcion = traducirWeatherCode(weathercode);
  const icono = iconoWeatherCode(weathercode);
  const temperaturaTexto = formatearTemperatura(temperatura);

  const insigniaCache = desdeCache
    ? '<span class="clima__insignia-cache" title="Dato guardado hace menos de 1 hora">⚡ En caché</span>'
    : '';

  // Reiniciamos el bloque de pronóstico cada vez que se muestra un
  // clima nuevo, para no dejar visible el pronóstico de la ciudad anterior.
  if (contenedorPronostico) {
    contenedorPronostico.innerHTML = '';
  }

  const botonPronostico = alPedirPronostico
    ? '<button type="button" id="boton-pronostico" class="boton-secundario">📅 Ver pronóstico de 5 días</button>'
    : '';

  contenedorResultado.innerHTML = `
    <article class="clima">
      <p class="clima__ciudad">${ciudad}</p>
      <div class="clima__cabecera">
        <span class="clima__icono" aria-hidden="true">${icono}</span>
        <p class="clima__temperatura">${temperaturaTexto}</p>
      </div>
      <p class="clima__descripcion">${descripcion}</p>
      ${insigniaCache}
      <div class="clima__detalles">
        <div class="detalle">
          <span class="detalle__icono" aria-hidden="true">💧</span>
          <span class="detalle__etiqueta">Humedad</span>
          <span class="detalle__valor">${formatearHumedad(humedad)}</span>
        </div>
        <div class="detalle">
          <span class="detalle__icono" aria-hidden="true">💨</span>
          <span class="detalle__etiqueta">Viento</span>
          <span class="detalle__valor">${formatearViento(vientoKmh)}</span>
        </div>
        <div class="detalle">
          <span class="detalle__icono" aria-hidden="true">🌧️</span>
          <span class="detalle__etiqueta">Precipitación</span>
          <span class="detalle__valor">${formatearPrecipitacion(precipitacionMm)}</span>
        </div>
      </div>
      ${botonPronostico}
    </article>
  `;

  if (alPedirPronostico) {
    document.getElementById('boton-pronostico').addEventListener('click', alPedirPronostico, { once: false });
  }
}

/**
 * mostrarCargandoPronostico()
 * Estado de carga específico para el bloque de pronóstico, que vive
 * debajo de la tarjeta de clima actual.
 */
export function mostrarCargandoPronostico() {
  if (!contenedorPronostico) return;
  contenedorPronostico.innerHTML = `
    <div class="estado estado--cargando">
      <span class="spinner" aria-hidden="true"></span>
      <p>Cargando pronóstico...</p>
    </div>
  `;
}

/**
 * mostrarPronostico(dias)
 * ----------------------------
 * Pinta una fila de tarjetas, una por día, con la temperatura
 * máxima/mínima, el ícono del clima y la precipitación esperada.
 *
 * @param {Array<{ fecha: string, tempMax: number, tempMin: number, weathercode: number, precipitacionMm: number }>} dias
 */
export function mostrarPronostico(dias) {
  if (!contenedorPronostico) return;

  const tarjetas = dias
    .map((dia, indice) => {
      const etiquetaDia = formatearDiaSemana(dia.fecha, indice);
      const icono = iconoWeatherCode(dia.weathercode);
      return `
        <article class="dia-pronostico">
          <p class="dia-pronostico__dia">${etiquetaDia}</p>
          <span class="dia-pronostico__icono" aria-hidden="true">${icono}</span>
          <p class="dia-pronostico__temps">
            <span class="dia-pronostico__max">${formatearTemperatura(dia.tempMax)}</span>
            <span class="dia-pronostico__min">${formatearTemperatura(dia.tempMin)}</span>
          </p>
          <p class="dia-pronostico__precipitacion">🌧️ ${formatearPrecipitacion(dia.precipitacionMm)}</p>
        </article>
      `;
    })
    .join('');

  contenedorPronostico.innerHTML = `
    <h2 class="pronostico__titulo">Pronóstico de 5 días</h2>
    <div class="pronostico__grid">${tarjetas}</div>
  `;
}

export function mostrarError(mensaje, contenedor = contenedorResultado) {
  contenedor.innerHTML = `
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
  if (contenedorPronostico) contenedorPronostico.innerHTML = '';
}

export function mostrarOpcionesCiudad(opciones, alElegir) {
  const botones = opciones
    .map((opcion, indice) => {
      const etiqueta = opcion.pais ? `${opcion.ciudad}, ${opcion.pais}` : opcion.ciudad;
      return `<button type="button" class="opcion-ciudad" data-indice="${indice}">${etiqueta}</button>`;
    })
    .join('');

  contenedorResultado.innerHTML = `
    <div class="estado estado--opciones">
      <p>Encontramos varias ciudades. ¿Cuál buscabas?</p>
      <div class="opciones-ciudad">${botones}</div>
    </div>
  `;

  contenedorResultado.querySelectorAll('.opcion-ciudad').forEach((boton) => {
    boton.addEventListener('click', () => {
      const indice = Number(boton.dataset.indice);
      alElegir(opciones[indice]);
    });
  });
}

export function establecerBotonCargando(boton, estaCargando, textoCargando = 'Buscando…', textoNormal = 'Buscar') {
  boton.disabled = estaCargando;
  boton.textContent = estaCargando ? textoCargando : textoNormal;
}

/**
 * mostrarComparacion(resultados)
 * -----------------------------------
 * Pinta una tarjeta por cada ciudad consultada en el modo
 * comparativo. Las ciudades que fallaron muestran su propio mensaje
 * de error en vez de tumbar toda la comparación.
 *
 * @param {Array} resultados - Ver formato en api.js: obtenerClimaDeVariasCiudades()
 */
export function mostrarComparacion(resultados) {
  if (!contenedorComparar) return;

  const tarjetas = resultados
    .map((resultado) => {
      if (!resultado.ok) {
        return `
          <article class="comparar__tarjeta comparar__tarjeta--error">
            <p class="comparar__ciudad">${resultado.nombreBuscado}</p>
            <p class="comparar__error">⚠️ ${resultado.mensaje}</p>
          </article>
        `;
      }

      const icono = iconoWeatherCode(resultado.weathercode);
      const descripcion = traducirWeatherCode(resultado.weathercode);
      return `
        <article class="comparar__tarjeta">
          <p class="comparar__ciudad">${resultado.ciudad}</p>
          <span class="comparar__icono" aria-hidden="true">${icono}</span>
          <p class="comparar__temperatura">${formatearTemperatura(resultado.temperatura)}</p>
          <p class="comparar__descripcion">${descripcion}</p>
          <div class="comparar__detalles">
            <span>💧 ${formatearHumedad(resultado.humedad)}</span>
            <span>💨 ${formatearViento(resultado.vientoKmh)}</span>
            <span>🌧️ ${formatearPrecipitacion(resultado.precipitacionMm)}</span>
          </div>
        </article>
      `;
    })
    .join('');

  contenedorComparar.innerHTML = `<div class="comparar__grid">${tarjetas}</div>`;
}

/**
 * cambiarPestana(nombrePestana)
 * ----------------------------------
 * Alterna entre los paneles "individual" y "comparar", incluyendo el
 * estilo de la pestaña activa y el atributo aria-selected.
 *
 * @param {'individual' | 'comparar'} nombrePestana
 */
export function cambiarPestana(nombrePestana) {
  pestanas.forEach((pestana) => {
    const esActiva = pestana.dataset.pestana === nombrePestana;
    pestana.classList.toggle('pestana--activa', esActiva);
    pestana.setAttribute('aria-selected', String(esActiva));
  });

  paneles.forEach((panel) => {
    panel.classList.toggle('panel--oculto', panel.dataset.panel !== nombrePestana);
  });
}