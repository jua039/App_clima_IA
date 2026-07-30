# 🌤️ Weather App — Clima Ahora

Aplicación web sencilla que permite consultar el clima actual de cualquier ciudad del mundo, usando la API gratuita de **Open-Meteo**. Construida con JavaScript vanilla (sin frameworks), separando claramente la lógica de datos, la interfaz y las funciones auxiliares.

---

## 📋 Resumen del Proyecto

Esta app recibe el nombre de una ciudad escrito por el usuario, lo convierte en coordenadas geográficas mediante la API de Geocodificación de Open-Meteo, y con esas coordenadas consulta el clima actual (temperatura y condición). El resultado se muestra en pantalla de forma clara e inmediata, sin necesidad de backend ni API key.

La app está pensada como proyecto de aprendizaje/portafolio: prioriza código legible, comentado y organizado en módulos con una única responsabilidad cada uno.

---

## 🛠️ Instrucciones de Instalación

### Requisitos previos
- [Node.js](https://nodejs.org/) instalado (para usar `npm` y el servidor de desarrollo).
- Un editor de código, como VS Code.

### Pasos

1. **Clona o descarga el proyecto** y ubícate en la carpeta raíz:
   ```bash
   cd weather-app
   ```

2. **Instala las dependencias** (solo se usa `live-server` como servidor de desarrollo):
   ```bash
   npm install
   ```

3. **Levanta el servidor local:**
   ```bash
   npm run dev
   ```
   Esto abrirá automáticamente `http://localhost:5500` en tu navegador.

> ⚠️ **Importante:** el proyecto usa módulos de JavaScript (`type="module"`), por lo que **no funciona** si abres `index.html` haciendo doble clic (protocolo `file://`). Necesitas un servidor local — ya sea `npm run dev`, o la extensión **Live Server** de VS Code (clic derecho sobre `index.html` → "Open with Live Server").

No se necesita ninguna API key: Open-Meteo es completamente gratuita y de acceso abierto.

---

## 🚀 Guía de Uso

1. Abre la aplicación en el navegador (ver pasos de instalación).
2. Escribe el nombre de una ciudad en el campo de texto (ej. `Bogotá`, `Madrid`, `Tokio`).
3. Presiona **Enter** o haz clic en el botón **Buscar**.
4. Mientras se consulta la API, el botón muestra "Buscando…" y se deshabilita.
5. Según el resultado, verás una de estas pantallas:
   - **Clima de la ciudad** (temperatura + descripción), si hay una única coincidencia.
   - **Lista de ciudades para elegir**, si el nombre es ambiguo (ej. "Córdoba" existe en España y Argentina).
   - **Mensaje de error**, si la ciudad no existe o hay un problema de conexión.

---

## 📸 Ejemplo de Resultados

**Búsqueda exitosa** (`Bogotá`):
```
Bogotá, Colombia
18.2 °C
Parcialmente nublado
```

**Ciudad ambigua** (`Córdoba`):
```
Encontramos varias ciudades. ¿Cuál buscabas?
[ Córdoba, Argentina ]
[ Córdoba, España ]
```

**Ciudad no encontrada** (`asdfqwerty`):
```
⚠️ No se encontró la ciudad "asdfqwerty".
Verifica el nombre e intenta de nuevo.
```

**Fragmento de código — función principal (`js/api.js`):**
```javascript
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
  };
}
```

---

## ✨ Funcionalidades

- 🔍 Búsqueda de clima actual por nombre de ciudad.
- 🌎 Traducción automática de nombre de ciudad → coordenadas (geocodificación).
- 🌡️ Temperatura formateada y descripción del clima en español (traducción de los códigos WMO de Open-Meteo).
- 🏙️ **Resolución de ciudades ambiguas**: si hay varias ciudades con el mismo nombre, se muestran como opciones para que el usuario elija, en vez de asumir la primera coincidencia.
- 🚫 **Prevención de doble envío**: el botón de búsqueda se deshabilita mientras hay una petición en curso.
- ⏱️ **Cancelación de peticiones obsoletas** con `AbortController`: si el usuario busca una nueva ciudad antes de que termine la búsqueda anterior, esta se cancela para evitar resultados inconsistentes (race conditions).
- ⌨️ Soporte para búsqueda con clic en el botón **o** tecla Enter.
- 📱 Diseño responsive, centrado en pantalla, con estados visuales claros (carga, error, resultado, selección de ciudad).
- 🧩 Código organizado por responsabilidad: `api.js` (datos), `ui.js` (DOM), `utils.js` (helpers), `main.js` (orquestación).

---

## 🧯 Manejo de Errores

La aplicación distingue y comunica claramente distintos tipos de fallo:

| Situación | Comportamiento |
|---|---|
| Campo de texto vacío | Error inmediato ("Debes escribir el nombre de una ciudad"), sin llegar a consultar la API. |
| Ciudad no encontrada | Mensaje claro indicando que no se encontró la ciudad, sugiriendo verificar el nombre. |
| Nombre ambiguo (varias ciudades) | No se asume ninguna: se muestra la lista de coincidencias para que el usuario elija. |
| Sin conexión a internet / fetch falla | Mensaje de error específico ("No se pudo conectar con el servicio... revisa tu conexión"), diferenciado de un error de "ciudad no encontrada". |
| Respuesta de la API sin datos de clima | Mensaje de error controlado, en vez de que la app falle silenciosamente o muestre `undefined`. |
| Búsqueda cancelada por otra más reciente | Se ignora silenciosamente (no se le muestra como error al usuario, ya que fue una cancelación intencional, no un fallo). |
| Doble clic / múltiples búsquedas rápidas | El botón se deshabilita durante la carga, evitando peticiones duplicadas en paralelo. |

---

## 🌐 Información de la API

Este proyecto usa **[Open-Meteo](https://open-meteo.com/)**, una API meteorológica gratuita y de código abierto que no requiere API key ni registro.

- **API de Geocodificación** — convierte un nombre de ciudad en coordenadas:
  `https://geocoding-api.open-meteo.com/v1/search?name={ciudad}&count=5&language=es&format=json`

- **API de Pronóstico/Clima actual** — obtiene el clima con coordenadas:
  `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true`

- Los códigos de clima (`weathercode`) siguen el estándar **WMO (World Meteorological Organization)** y se traducen a texto en español en `js/utils.js`.

---

## 🔮 Mejoras Futuras

- [ ] Selector de unidades de temperatura (Celsius / Fahrenheit).
- [ ] Guardar la última ciudad buscada (o un historial reciente) usando almacenamiento persistente.
- [ ] Pronóstico extendido (próximos días), no solo el clima actual.
- [ ] Detección automática de ubicación del usuario (Geolocation API) como búsqueda inicial.
- [ ] Modo oscuro/claro configurable (actualmente el diseño es fijo, tipo "atardecer").
- [ ] Tests automatizados (unitarios para `api.js`/`utils.js`, y de interfaz para los flujos principales).
- [ ] Internacionalización (soporte multi-idioma más allá del español).
- [ ] Íconos de clima ilustrados (SVG) en vez de emojis, para consistencia visual entre sistemas operativos.

---

## 📁 Estructura del Proyecto

```
weather-app/
├── css/
│   └── styles.css       # Estilos (diseño "atardecer", responsive)
├── js/
│   ├── api.js           # Comunicación con las APIs de Open-Meteo
│   ├── ui.js             # Renderizado y manipulación del DOM
│   ├── utils.js          # Funciones auxiliares (formato, traducción de códigos)
│   └── main.js           # Conecta eventos de la interfaz con api.js y ui.js
├── index.html
├── package.json
└── README.md
```