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
    const { hotel_id } = req.query;
    if (!hotel_id) return res.status(400).json({ error: "hotel_id is required" });

    const rooms = await RoomModel.getRooms(hotel_id);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// ================== DASHBOARD API ==================
exports.getRoomDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get room details
    const room = await RoomModel.getRoomById(id);
    if (!room) {
      return res.status(404).json({
        message: "Room not found",
        status: 0,
        response: null
      });
    }

    // Get hotel information
    const hotel = await hotelModel.getHotelById(room.hotel_id);
    
    // Get reservation information
    const reservation = await reservationModel.getReservationByRoomId(id);

    const guest = await guestModel.getGuestById(reservation.guest_id);
    
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
    
    // Construct dashboard response
    const dashboardResponse = {
      roomId: parseInt(id),
      roomNo: room.room_number,
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

// Helper function to get weather information
function getWeatherInfo() {
  // This would typically call a weather API
  // For now, returning mock data
  return {
    time: new Date().toISOString(),
    tempC: 25,
    weather_code: 0,
    condition: "Clear",
    weather_image: "sunny.png"
  };
}

// Helper function to get contact information
function getContactInfo(hotel) {
  return {
    phoneNumber: hotel?.service_care_no || "123-456-7890"
  };
}
