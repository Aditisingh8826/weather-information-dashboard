/* ==========================================================================
   Software Engineering Module Architecture:
   1. Input Module
   2. API Request Module
   3. Response Handling & JSON Parsing Module
   4. Weather Display Module
   5. Error Handling & UI State Module
   ========================================================================== */

// Event Listeners for Input Operations
document.getElementById('cityInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    getWeather();
  }
});

/**
 * Main Controller Function (Coordinates workflow across all modules)
 */
async function getWeather() {
  const cityInput = document.getElementById('cityInput').value.trim();

  // MODULE: Input Module - Validation
  if (!cityInput) {
    showError("Please enter a city name.");
    return;
  }

  showLoading(true);
  hideError();
  hideWeatherCard();

  try {
    // MODULE: API Request Module - Geocoding Lookup
    const locationData = await getCoordinates(cityInput);

    if (!locationData) {
      showError("City not found. Please enter a valid city name.");
      showLoading(false);
      return;
    }

    // MODULE: API Request Module - Weather Data Retrieval
    const rawWeatherData = await fetchWeather(locationData.latitude, locationData.longitude);

    // MODULE: Response Handling & JSON Parsing Module
    const parsedWeatherData = parseWeatherData(locationData, rawWeatherData);

    // MODULE: Weather Display Module
    displayWeather(parsedWeatherData);

  } catch (error) {
    // MODULE: Error Handling Module
    console.error("Workflow Error:", error);
    showError("Unable to fetch weather data. Please try again.");
  } finally {
    showLoading(false);
  }
}

/**
 * MODULE: API Request Module (Geocoding API Interface)
 */
async function getCoordinates(cityName) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;

  const response = await fetch(geoUrl);
  if (!response.ok) {
    throw new Error("Geocoding service unavailable");
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    return null;
  }

  return {
    name: data.results[0].name,
    country: data.results[0].country || "",
    admin1: data.results[0].admin1 || "",
    latitude: data.results[0].latitude,
    longitude: data.results[0].longitude
  };
}

/**
 * MODULE: API Request Module (Forecast API Interface)
 */
async function fetchWeather(lat, lon) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;

  const response = await fetch(weatherUrl);
  if (!response.ok) {
    throw new Error("Weather service unavailable");
  }

  return await response.json();
}

/**
 * MODULE: Response Handling & JSON Parsing Module
 */
function parseWeatherData(location, weatherJson) {
  const current = weatherJson.current;
  const condition = weatherDescription(current.weather_code);

  return {
    cityName: location.name,
    region: location.admin1 ? `${location.admin1}, ${location.country}` : location.country,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    conditionText: condition.description,
    icon: condition.icon
  };
}

/**
 * Helper Module: Weather Code Mapper (Converts WMO codes to conditions/icons)
 */
function weatherDescription(code) {
  if (code === 0) return { description: "Clear Sky", icon: "☀️" };
  if (code >= 1 && code <= 3) return { description: "Partly Cloudy", icon: "⛅" };
  if (code === 45 || code === 48) return { description: "Foggy", icon: "🌫️" };
  if (code >= 51 && code <= 55) return { description: "Drizzle", icon: "🌧️" };
  if (code >= 61 && code <= 65) return { description: "Rain", icon: "🌧️" };
  if (code >= 71 && code <= 75) return { description: "Snow", icon: "❄️" };
  if (code >= 80 && code <= 82) return { description: "Rain Showers", icon: "🌦️" };
  if (code >= 95 && code <= 99) return { description: "Thunderstorm", icon: "🌩️" };

  return { description: "Unknown", icon: "🌡️" };
}

/**
 * MODULE: Weather Display Module (Updates GUI)
 */
function displayWeather(data) {
  document.getElementById('cityName').textContent = data.cityName;
  document.getElementById('countryName').textContent = data.region;
  document.getElementById('temperature').textContent = data.temperature;
  document.getElementById('weatherCondition').textContent = data.conditionText;
  document.getElementById('weatherIcon').textContent = data.icon;
  document.getElementById('humidity').textContent = `${data.humidity}%`;
  document.getElementById('windSpeed').textContent = `${data.windSpeed} km/h`;
  document.getElementById('feelsLike').textContent = `${data.feelsLike}°C`;

  document.getElementById('weatherCard').classList.remove('hidden');
}

/**
 * MODULE: Error Handling & UI State Module
 */
function showError(message) {
  const errorBox = document.getElementById('errorMessage');
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function hideError() {
  document.getElementById('errorMessage').classList.add('hidden');
}

function hideWeatherCard() {
  document.getElementById('weatherCard').classList.add('hidden');
}

function showLoading(isLoading) {
  const loadingBox = document.getElementById('loading');
  const searchBtn = document.getElementById('searchBtn');

  if (isLoading) {
    loadingBox.classList.remove('hidden');
    searchBtn.disabled = true;
  } else {
    loadingBox.classList.add('hidden');
    searchBtn.disabled = false;
  }
}