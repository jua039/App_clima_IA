/**
 * main.js
 * Punto de entrada de la aplicación. Conecta los eventos de la interfaz
 * con la lógica de api.js y la presentación de ui.js.
 */

import { fetchWeatherByCity, CityNotFoundError } from './api.js';
import { renderLoading, renderWeather, renderError } from './ui.js';

const form = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');

/**
 * Maneja el envío del formulario (clic en "Buscar" o Enter en el input,
 * ya que ambos disparan el evento "submit" de un <form>).
 */
async function handleSearch(event) {
  event.preventDefault(); // Evita que la página se recargue

  const city = cityInput.value;

  renderLoading();

  try {
    const weatherData = await fetchWeatherByCity(city);
    renderWeather(weatherData);
  } catch (error) {
    // Distinguimos el mensaje según el tipo de error para dar feedback claro
    if (error instanceof CityNotFoundError) {
      renderError(error.message);
    } else {
      renderError(error.message || 'Ocurrió un error inesperado. Intenta de nuevo.');
    }
  }
}

form.addEventListener('submit', handleSearch);