/**
 * ui.js
 * Toda manipulación del DOM vive aquí. api.js no sabe nada del DOM,
 * y main.js no toca el DOM directamente: siempre pasa por estas funciones.
 */

import { formatTemperature, getWeatherDescription } from './utils.js';

const resultContainer = document.getElementById('result-container');

/**
 * Muestra un estado de carga mientras se espera la respuesta de la API.
 */
export function renderLoading() {
  resultContainer.innerHTML = `
    <div class="result__state result__state--loading">
      <span class="spinner" aria-hidden="true"></span>
      <p>Consultando el clima…</p>
    </div>
  `;
}

/**
 * Renderiza el clima actual de una ciudad.
 * @param {{ city: string, country: string, temperature: number, weatherCode: number, windSpeed: number }} weatherData
 */
export function renderWeather(weatherData) {
  const { city, country, temperature, weatherCode, windSpeed } = weatherData;
  const { text: conditionText, icon } = getWeatherDescription(weatherCode);
  const location = country ? `${city}, ${country}` : city;

  resultContainer.innerHTML = `
    <article class="weather">
      <p class="weather__location">${location}</p>
      <div class="weather__main">
        <span class="weather__icon" aria-hidden="true">${icon}</span>
        <span class="weather__temp">${formatTemperature(temperature)}</span>
      </div>
      <p class="weather__condition">${conditionText}</p>
      <p class="weather__wind">Viento: ${windSpeed} km/h</p>
    </article>
  `;
}

/**
 * Muestra un mensaje de error en el contenedor de resultados.
 * @param {string} message
 */
export function renderError(message) {
  resultContainer.innerHTML = `
    <div class="result__state result__state--error" role="alert">
      <span aria-hidden="true">⚠️</span>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Regresa el contenedor a su estado inicial (placeholder).
 */
export function clearResult() {
  resultContainer.innerHTML = `
    <p class="result__placeholder">Tu resultado aparecerá aquí.</p>
  `;
}