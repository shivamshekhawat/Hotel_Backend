const RoomModel = require("../models/roomModel");
const { sql, poolConnect } = require("../db");
const { generateToken } = require("../configuration/tokenGenerator");
const guestModel = require("../models/guestModel");
const reservationModel = require("../models/reservationModel");
const roomControlModel = require("../models/roomControlModel");
const roomTemperatureModel = require("../models/roomTemperatureModel");
const doNotDisturbModel = require("../models/doNotDisturbModel");
const notificationModel = require("../models/notificationModel");
const hotelModel = require("../models/hotelModel");

// ================== CREATE ROOM CONTROLLER ==================
exports.createRoom = async (req, res) => {
  try {
    console.log('req.body', req.body);
    const result = await RoomModel.createRoom(req.body);
    // Handle duplicate
    if (result.error) {
      return res.status(409).json({ error: result.error });
    }
    res.status(201).json({ message: "Room created successfully with RoomTemperature & DND", room: result.data });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.loginRoom = async (req, res) => {
  try {
    const result = await RoomModel.loginRoom(req.body);
    if (!result) return res.status(404).json({ error: "Invalid credentials" });
    const token = generateToken({ room_id: result.room_id, hotel_id: result.hotel_id, role: "room" });
    await RoomModel.updateToken(result.room_id, token);
    await RoomModel.updateFcmToken(result.room_id, req.body.fcm_token);
    await RoomModel.updateDeviceId(result.room_id, req.body.device_id);
  
    res.status(200).json({
      message: "Login successful",
      response: {room_id: result.room_id,
      hotel_id: result.hotel_id,
      role: "room",
      token: token},
      status: 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== GET ROOMS BY HOTEL ==================

exports.getRoomsByHotel = async (req, res) => {
  try {
    const hotel_id = req.params.hotelId;
    
    // Validate hotel_id exists and is a valid number
    if (!hotel_id) {
      console.error('Missing hotel_id parameter');
      return res.status(400).json({ 
        status: 0,
        message: "Hotel ID is required in the URL",
        response: null
      });
    }

    // Convert to number and validate
    const hotelIdNum = parseInt(hotel_id, 10);
    if (isNaN(hotelIdNum) || hotelIdNum <= 0) {
      console.error(`Invalid hotel_id: ${hotel_id}`);
      return res.status(400).json({
        status: 0,
        message: "Invalid Hotel ID. Must be a positive number",
        response: null
      });
    }

    console.log(`[RoomController] Fetching rooms for hotel_id: ${hotelIdNum}`);
    const rooms = await RoomModel.getRooms(hotelIdNum);
    
    if (!rooms || rooms.length === 0) {
      console.log(`[RoomController] No rooms found for hotel_id: ${hotelIdNum}`);
      return res.status(200).json({
        status: 1,
        message: "No rooms found for the specified hotel",
        response: []
      });
    }

    console.log(`[RoomController] Found ${rooms.length} rooms for hotel_id: ${hotelIdNum}`);
    res.status(200).json({
      status: 1,
      message: "Rooms retrieved successfully",
      response: rooms
    });
  } catch (error) {
    console.error('[RoomController] Error in getRoomsByHotel:', error);
    res.status(500).json({ 
      status: 0,
      message: "Internal server error",
      error: error.message 
    });
  }
};

// ================== GET ROOM BY ID ==================
exports.getRoomById = async (req, res) => {
  try {
    const room = await RoomModel.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== UPDATE ROOM ==================
exports.updateRoom = async (req, res) => {
  try {
    const updatedRoom = await RoomModel.updateRoom(req.params.id, req.body);
    res.json({ message: "Room updated successfully", room: updatedRoom });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== DELETE ROOM ==================
exports.deleteRoom = async (req, res) => {
  try {
    const deleted = await RoomModel.deleteRoom(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Room not found" });

    await poolConnect;
    const request = new sql.Request();
    await request.input("room_id", sql.Int, req.params.id).query("DELETE FROM RoomTemperature WHERE room_id=@room_id");
    await request.input("room_id", sql.Int, req.params.id).query("DELETE FROM DND WHERE room_id=@room_id");

    res.json({ message: "Room deleted successfully along with RoomTemperature & DND" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateRoomGreeting = async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { language, message } = req.body;

    if (!language || !message) {
      return res.status(400).json({ status: 0, message: "Language and message are required" });
    }

    const result = await RoomModel.updateGreeting(roomNumber, language, message);

    res.status(200).json({
      status: 1,
      message: "Greeting updated successfully",
      roomNumber: result.roomNumber,
      language: result.language
    });
  } catch (error) {
    console.error("Error updating room greeting:", error);
    res.status(500).json({ status: 0, message: error.message });
  }
};

// ================== GET ROOM GREETING ==================
exports.getRoomGreeting = async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const language = req.query.language || "en";

    const result = await RoomModel.getGreeting(roomNumber, language);

    res.status(200).json({
      status: 1,
      roomNumber: result.roomNumber,
      message: result.message
    });
  } catch (error) {
    console.error("Error fetching room greeting:", error);
    res.status(500).json({ status: 0, message: error.message });
  }
};
// ================== DASHBOARD API ==================
exports.getRoomDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Dashboard] Fetching dashboard for room ID: ${id}`);
    
    if (!id) {
      console.error('[Dashboard] Error: No room ID provided in request');
      return res.status(400).json({
        message: 'Room ID is required',
        status: 0,
        response: null
      });
    }
    
    // Get room details
    console.log('[Dashboard] Fetching room details...');
    const room = await RoomModel.getRoomById(id);
    console.log('[Dashboard] Room data from DB:', room ? 'Found' : 'Not found');
    
    if (!room) {
      console.error(`[Dashboard] Room with ID ${id} not found in database`);
      return res.status(404).json({
        message: `Room with ID ${id} not found`,
        status: 0,
        response: null
      });
    }
    
    if (!room) {
      console.log(`[Dashboard] Room with ID ${id} not found`);
      return res.status(404).json({
        message: `Room with ID ${id} not found`,
        status: 0,
        response: null
      });
    }

    // Get hotel information
    const hotel = await hotelModel.getHotelById(room.hotel_id);
    
    // Get reservation information
    const reservation = await reservationModel.getReservationByRoomId(id);

    const guest = null;

    if (reservation) {
     guest = await guestModel.getGuestById(reservation.guest_id);
    }
    // Get room controls
    const controls = await roomControlModel.getRoomControlByRoomId(id);
    
    // Get room temperature
    const temperature = await roomTemperatureModel.getRoomTemperatureByRoomId(id);
    
    // Get DND status
    const dnd = await doNotDisturbModel.getDNDByRoomId(id);
    
    // Get notifications for this room
    const notifications = await notificationModel.getNotificationsByRoomId(id);
    
    // Get clean room status (assuming this is a service request)
    const cleanRoom = await getCleanRoomStatus(id);
    
    // Get weather information (mock data for now)
    const weather = getWeatherInfo();
    
    // Get contact information
    const contact = getContactInfo(hotel);
    // Generate dynamic greeting based on guest and hotel info
    let greetingMessage = "";
    if (guest?.name) {
      greetingMessage = `Welcome ${guest.name} to ${hotel?.name || "our hotel"}`;
    } else {
      greetingMessage = `Welcome to ${hotel?.name || "our hotel"}`;
    }
    
    // Construct dashboard response
    const dashboardResponse = {
      roomId: parseInt(id),
      roomNo: room.room_number,
      greeting: greetingMessage,
      hotel: {
        hotelId: hotel?.hotel_id || 0,
        name: hotel?.name || "",
        logoUrl: hotel?.logo_url || "",
        establishedYear: hotel?.established_year || 0,
        address: {
          street: hotel?.address || "",
          city: hotel?.city || "",
          country: hotel?.country || "",
          postalCode: hotel?.postal_code || ""
        }
      },
      guest: {
        guestId: guest?.guest_id || 0,
        name: guest?.name || "",
        adults: guest?.adults || 0,
        children: guest?.children || 0,
        language: guest?.language || "en"
      },
      reservation: {
        reservationId: reservation?.reservation_id || 0,
        checkInTime: reservation?.check_in_time || "",
        checkOutTime: reservation?.check_out_time || "",
        isCheckedIn: reservation?.is_checked_in || false
      },
      cleanRoom: cleanRoom,
      weather: weather,
      controls: {
        masterLight: controls?.master_light || false,
        readingLight: controls?.reading_light || false,
        masterCurtain: controls?.master_curtain || false,
        masterWindow: controls?.master_window || false,
        lightMode: controls?.light_mode || "Warm",
        temperature: temperature ? {
          currentTemp: temperature.temperature || 24,
          setTemp: temperature.temperature || 24
        } : null
      },
      dnd: {
        isActive: dnd?.is_active || false,
        updatedTime: dnd?.updated_time || new Date().toISOString()
      },
      contact: contact,
      notifications: notifications.map(notif => ({
        id: notif.notification_id,
        message: notif.message,
        isRead: notif.is_read || false
      }))
    };

    res.json({
      message: "Dashboard data retrieved successfully",
      status: 1,
      response: dashboardResponse
    
    });

  } catch (error) {
    console.error("Dashboard API error:", error);
    res.status(500).json({
      message: "Internal server error",
      status: 0,
      response: null
    });
  }
};

// Helper function to get clean room status
async function getCleanRoomStatus(roomId) {
  try {
    // This would typically query a room service or cleaning status table
    // For now, returning mock data
    return {
      lastRequestTime: new Date().toISOString(),
      status: "completed",
      pending: false
    };
  } catch (error) {
    return {
      lastRequestTime: "",
      status: "unknown",
      pending: false
    };
  }
}

// Weather data storage (in-memory object)
let weatherData = {
  time: new Date().toISOString(),
  tempC: 25,
  weather_code: 0,
  condition: "Clear",
  weather_image: "sunny.png"
};

// Weather API configuration
const WEATHER_API_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const WEATHER_UPDATE_INTERVAL = 20 * 60 * 1000; // 20 minutes in milliseconds

// Weather code to condition mapping (matching Kotlin implementation)
const WEATHER_CONDITIONS = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Rain",
  63: "Rain",
  65: "Rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Snow",
  73: "Snow",
  75: "Snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Rain showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail"
};

// Weather code to image mapping (matching Kotlin implementation)
const WEATHER_IMAGES = {
  0: "assets/sunny.png",
  1: "assets/pcloudy.png",
  2: "assets/pcloudy.png",
  3: "assets/pcloudy.png",
  45: "assets/Foggy.png",
  48: "assets/Foggy.png",
  51: "assets/Lrain.png",
  53: "assets/Lrain.png",
  55: "assets/Lrain.png",
  56: "assets/Sleet.png",
  57: "assets/Sleet.png",
  61: "assets/Rain.png",
  63: "assets/Rain.png",
  65: "assets/Rain.png",
  66: "assets/Sleet.png",
  67: "assets/Sleet.png",
  71: "assets/Snow.png",
  73: "assets/Snow.png",
  75: "assets/Snow.png",
  77: "assets/Snow.png",
  80: "assets/Rain.png",
  81: "assets/Rain.png",
  82: "assets/Rain.png",
  85: "assets/Snow.png",
  86: "assets/Snow.png",
  95: "assets/TStorm.png",
  96: "assets/TStorm.png",
  99: "assets/TStorm.png"
};

// Helper function to get weather information
function getWeatherInfo() {
  return weatherData;
}

// Function to get current system location
async function getCurrentSystemLocation() {
  try {
    // Try to get location from IP geolocation service
    const response = await fetch('http://ip-api.com/json/');
    if (!response.ok) {
      throw new Error('Failed to fetch location from IP service');
    }
    
    const locationData = await response.json();
    
    if (locationData.status === 'success' && locationData.lat && locationData.lon) {
      console.log(`System location detected: ${locationData.city}, ${locationData.country} (${locationData.lat}, ${locationData.lon})`);
      return {
        latitude: locationData.lat,
        longitude: locationData.lon,
        city: locationData.city,
        country: locationData.country
      };
    } else {
      throw new Error('Invalid location data received');
    }
  } catch (error) {
    console.warn('Could not detect system location:', error.message);
    console.log('Falling back to default location (New York)');
    
    // Fallback to default location
    return {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'United States'
    };
  }
}

// Function to build weather API URL
async function buildWeatherApiUrl() {
  try {
    const location = await getCurrentSystemLocation();
    const url = `${WEATHER_API_BASE_URL}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&timezone=auto`;
    console.log(`Weather API URL built for ${location.city}, ${location.country}`);
    return url;
  } catch (error) {
    console.error('Error building weather API URL:', error.message);
    // Fallback to default location
    const latitude = 40.7128;
    const longitude = -74.0060;
    return `${WEATHER_API_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
  }
}

// Function to get weather image from code (matching Kotlin implementation)
function getWeatherImageFromCode(weatherCode) {
  const imageName = (() => {
    switch (weatherCode) {
      case 0:
        return "assets/sunny.png";                    // Clear sky
      case 1:
      case 2:
      case 3:
        return "assets/pcloudy.png";                  // Mainly clear, partly cloudy, overcast
      case 45:
      case 48:
        return "assets/Foggy.png";                   // Fog and depositing rime fog
      case 51:
      case 53:
      case 55:
        return "assets/Lrain.png";                   // Drizzle: Light, moderate, dense intensity
      case 56:
      case 57:
        return "assets/Sleet.png";                   // Freezing Drizzle: Light and dense intensity
      case 61:
      case 63:
      case 65:
        return "assets/Rain.png";                    // Rain: Slight, moderate and heavy intensity
      case 66:
      case 67:
        return "assets/Sleet.png";                   // Freezing Rain: Light and heavy intensity
      case 71:
      case 73:
      case 75:
        return "assets/Snow.png";                    // Snow fall: Slight, moderate, and heavy intensity
      case 77:
        return "assets/Snow.png";                    // Snow grains
      case 80:
      case 81:
      case 82:
        return "assets/Rain.png";                    // Rain showers: Slight, moderate, and violent
      case 85:
      case 86:
        return "assets/Snow.png";                    // Snow showers slight and heavy
      case 95:
        return "assets/TStorm.png";                  // Thunderstorm: Slight or moderate
      case 96:
      case 99:
        return "assets/TStorm.png";                  // Thunderstorm with slight and heavy hail
      default:
        return "assets/mcloudy.png";                 // Default to mostly cloudy for unknown codes
    }
  })();
  
  return imageName;
}

// Function to get weather type from code (matching Kotlin implementation)
function getWeatherTypeFromCode(weatherCode) {
  switch (weatherCode) {
    case 0:
      return "Clear sky";
    case 1:
      return "Mainly clear";
    case 2:
      return "Partly cloudy";
    case 3:
      return "Overcast";
    case 45:
    case 48:
      return "Fog";
    case 51:
    case 53:
    case 55:
      return "Drizzle";
    case 56:
    case 57:
      return "Freezing drizzle";
    case 61:
    case 63:
    case 65:
      return "Rain";
    case 66:
    case 67:
      return "Freezing rain";
    case 71:
    case 73:
    case 75:
      return "Snow";
    case 77:
      return "Snow grains";
    case 80:
    case 81:
    case 82:
      return "Rain showers";
    case 85:
    case 86:
      return "Snow showers";
    case 95:
      return "Thunderstorm";
    case 96:
    case 99:
      return "Thunderstorm with hail";
    default:
      return "Unknown";
  }
}

// Function to fetch and save weather data
async function fetchAndSaveWeatherData() {
  try {
    console.log(`Fetching weather data at: ${new Date().toISOString()}`);
    
    const apiUrl = await buildWeatherApiUrl();
    if (!apiUrl) {
      console.log("Error: Could not determine server location for weather API");
      return;
    }
    
    console.log(`Using weather API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const weatherResponse = await response.json();
    
    if (weatherResponse && weatherResponse.current) {
      const currentWeather = weatherResponse.current;
      const weatherImage = getWeatherImageFromCode(currentWeather.weather_code);
      const weatherType = getWeatherTypeFromCode(currentWeather.weather_code);
      
      // Update the in-memory weather data object
      weatherData = {
        time: currentWeather.time,
        tempC: Math.round(currentWeather.temperature_2m),
        weather_code: currentWeather.weather_code,
        condition: weatherType,
        weather_image: weatherImage
      };
      
      console.log(`Weather data saved successfully: ${weatherType}, ${currentWeather.temperature_2m}°C, Image: ${weatherImage}`);
    }
    
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
  }
}

// Start the weather data scheduler
function startWeatherScheduler() {
  // Initial fetch
  fetchAndSaveWeatherData();
  
  // Set up interval for periodic updates
  setInterval(fetchAndSaveWeatherData, WEATHER_UPDATE_INTERVAL);
  
  console.log("Weather scheduler started - fetching every 20 minutes");
}

// Export the scheduler function
exports.startWeatherScheduler = startWeatherScheduler;

// Helper function to get contact information
function getContactInfo(hotel) {
  return {
    phoneNumber: hotel?.service_care_no || "123-456-7890"
  };
}

// ================== ROOM ACTION API ==================
exports.roomAction = async (req, res) => {
  try {
    const { isCheckin, roomId, isDndOn, lightningControl } = req.body;
    
    // Validate required fields
    if (!roomId) {
      return res.status(400).json({
        message: "Room ID is required",
        status: 0,
        response: null
      });
    }

    // Get room details to verify it exists
    const room = await RoomModel.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({
        message: "Room not found",
        status: 0,
        response: null
      });
    }

    // Update room controls if provided
    if (lightningControl) {
      await roomControlModel.updateRoomControl(roomId, {
        master_light: lightningControl.masterLight,
        reading_light: lightningControl.readingLight,
        master_curtain: lightningControl.masterCurtain,
        master_window: lightningControl.masterWindow,
        light_mode: lightningControl.lightMode
      });
    }

    // Update temperature if provided
    if (lightningControl?.temperature) {
      await roomTemperatureModel.updateRoomTemperatureByRoomId(roomId, {
        temperature: lightningControl.temperature.setTemp
      });
    }

    // Update DND status if provided
    if (isDndOn !== undefined) {
      await doNotDisturbModel.updateDND(roomId, { is_active: isDndOn });
    }

    // Update check-in status if provided
    if (isCheckin !== undefined) {
      const reservation = await reservationModel.getReservationByRoomId(roomId);
      if (reservation) {
        await reservationModel.updateReservation(reservation.reservation_id, { is_checked_in: isCheckin });
        console.log(`Room ${roomId} check-in status updated to: ${isCheckin}`);
      } else {
        console.log(`No active reservation found for room ${roomId}`);
      }
    }

    // Now call the dashboard API controller with the updated room ID
    req.params.id = roomId;
    await exports.getRoomDashboard(req, res);
 
  } catch (error) {
    console.error("Room action API error:", error);
    res.status(500).json({
      message: "Internal server error",
      status: 0,
      response: null
    });
  }
};
