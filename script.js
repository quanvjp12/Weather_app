const searchInput = document.querySelector(".search_input input");
const searchBtn = document.querySelector(".search_btn");

const City_name = document.getElementById("city_name");
const Temp = document.getElementById("temperature");
const Humidity = document.getElementById("humidity");
const Wind = document.getElementById("wind");
const Feel = document.getElementById("feel");
const Description = document.getElementById("description");
const Weather_icon = document.getElementById("icon_img");
const Current_date = document.getElementById("current_date");

const Forecast_card = document.querySelectorAll(".forecast_card");

const History_list = document.getElementById("history_list");

const Error_message = document.getElementById("error_message");
const Error_text = document.getElementById("error_text");

const darkBtn = document.querySelector(".dark_mode");

function showErrol(message){
    Error_message.style.display = "flex";
    Error_text.textContent = message;
}
function hideError(){
    Error_message.style.display = "none";
    Error_text.textContent = "";
}

function getCityDate(time) {
    const date = new Date(time);
    
    return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function clear(){
    City_name.textContent = "--";
    Temp.textContent = "--";
    Humidity.textContent = "--";
    Wind.textContent = "--";
    Feel.textContent = "--";
    Description.textContent = "--";
    Current_date.textContent = "--";
    Weather_icon.textContent = "--";
}

async function getForecast(lat, lon){
    const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Không thể lấy dữ báo thời tiết!");
    }
    const data = await response.json();
    return data;
}

function getWeatherIcon(code) {
    if (code === 0) {
        return{ 
            icon: "☀️",
            card_description: "Trời quang"
        };
    }
    if (code >= 1 && code <= 3) {
        return{
            icon: "⛅",
            card_description: "Có mây"
        };
    }
    if (code === 45 || code === 48) {
        return{
            icon: "🌫️",
            card_description: "Sương mù"
        };
    }
    if (code >= 51 && code <= 57) {
        return{
            icon: "🌦️",
            card_description: "Mưa phùn"
        };
    }
    if (code >= 61 && code <= 67) {
        return{
            icon: "🌧️",
            card_description: "Mưa"
        };
    }
    if (code >= 71 && code <= 77) {
        return{
            icon: "🌨️",
            card_description: "Tuyết rơi"
        };
    }
    if (code >= 80 && code <= 82) {
        return{
            icon: "🌦️",
            card_description: "Mưa rào"
        };
    }
    if (code === 95 || code === 96 || code === 99) {
        return{
            icon: "⛈️",
            card_description: "Mưa giông"
        };
    }
    return{
        icon: "🌤️",
        card_description: ""
    };
}

function displayForecast(data){
    const days = data.daily.time.slice(0, 7);
    days.forEach(function(day, index){
        const card = Forecast_card[index];
        const Forecast_day = card.querySelector(".forecast_day");
        const Forecast_date = card.querySelector(".forecast_date");
        const Forecast_icon = card.querySelector(".forecast_icon");
        const Forecast_description = card.querySelector(".forecast_description");
        const Forecast_temp = card.querySelector(".forecast_temp");
        const date = new Date(day);

        Forecast_day.textContent = date.toLocaleDateString("vi-VN", {weekday: "short"});
        Forecast_date.textContent = date.toLocaleDateString("vi-VN", {day: "2-digit", month: "2-digit"});

        const weatherCode = data.daily.weather_code[index];
        const info = getWeatherIcon(weatherCode);
        Forecast_icon.textContent = info.icon;
        Forecast_description.textContent = info.card_description;
        
        const maxTemp = data.daily.temperature_2m_max[index];
        Forecast_temp.textContent = Math.round(maxTemp) + "°C";
    }
    );
}

function saveHistory(city){
    let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    history = history.filter(function(item) {
        return item.toLowerCase() !== city.toLowerCase();
    });
    history.unshift(city);

    history = history.slice(0, 3);

    localStorage.setItem(
        "searchHistory",
        JSON.stringify(history)
    );
}

function displayHistory(){
    let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    History_list.innerHTML = "";
    history.forEach(function(city) {
        const item = document.createElement("button");
        item.classList.add("city");
        item.textContent = " 🔍︎ " + city;
        item.addEventListener("click", function() {
            searchInput.value = city;
            searchBtn.click();
        });
        History_list.appendChild(item);
    });
}

darkBtn.addEventListener("click", function(){
    document.body.classList.toggle("dark");
    if (document.body.classList.contains("dark")) {
        darkBtn.textContent = "☀︎ Light Mode";
    } else {
        darkBtn.textContent = "⏾ Dark Mode";
    }
});

searchBtn.addEventListener("click", async function(){
        const city = searchInput.value.trim();
        if(city === ""){
            clear();
            showErrol("Hãy nhập tên thành phố!");
            return;
        }
        hideError();
        const url = 
            `https://geocoding-api.open-meteo.com/v1/search` +
            `?name=${encodeURIComponent(city)}` +
            `&count=1` +
            `&language=vi` +
            `&format=json`;
        
        try {
            const response = await fetch(url);
            if(!response.ok){
                if(response.status === 404){
                    throw new Error("Không tìm thấy thành phố này! Hãy thử lại!");
                }
                throw new Error("Có lỗi khi gọi API!");
            }
            const data = await response.json();

            const lat = data.results[0].latitude;
            const lon = data.results[0].longitude;
            const forecastData = await getForecast(lat, lon);
        
            City_name.textContent = data.results[0].name;
            Temp.textContent = Math.round(forecastData.current.temperature_2m) + "°C";
            Humidity.textContent = forecastData.current.relative_humidity_2m + "%";
            Wind.textContent = forecastData.current.wind_speed_10m + "km/h";
            Feel.textContent = Math.round(forecastData.current.apparent_temperature) + "°C";
            Description.textContent = getWeatherIcon(forecastData.current.weather_code).card_description;
            Weather_icon.textContent = getWeatherIcon(forecastData.current.weather_code).icon;
            Current_date.textContent = getCityDate(forecastData.current.time);

            displayForecast(forecastData);

            saveHistory(data.results[0].name);
            displayHistory();

            console.log(getForecast(lat, lon));
            console.log(data);

        } catch (error) {
            clear();
            console.error(error);
            showErrol(error.message);
        }
    }
)