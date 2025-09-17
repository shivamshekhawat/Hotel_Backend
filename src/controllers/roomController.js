const roomService = require('../services/roomService');
const { asyncHandler } = require('../middleware/errorHandler');

class RoomController {
  /**
   * Create a new room
   */
  createRoom = asyncHandler(async (req, res) => {
    // Override hotel_id with the one from token
    req.body.hotel_id = req.hotel.hotel_id;
    
    const result = await roomService.createRoom(req.body);
    
    res.status(201).json({
      message: result.message,
      data: result.data
    });
  });

  /**
   * Get all rooms for hotel
   */
  getRoomsByHotel = asyncHandler(async (req, res) => {
    const hotelId = req.hotel.hotel_id;
    const rooms = await roomService.getRoomsByHotel(hotelId);
    
    res.json(rooms);
  });

  /**
   * Get room by ID
   */
  getRoomById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const room = await roomService.getRoomById(id);
    
    // Verify room belongs to the hotel
    if (room.hotel_id !== req.hotel.hotel_id) {
      return res.status(404).json({ 
        error: 'Room not found' 
      });
    }
    
    res.json(room);
  });

  /**
   * Update room
   */
  updateRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Verify room belongs to the hotel
    const existingRoom = await roomService.getRoomById(id);
    if (existingRoom.hotel_id !== req.hotel.hotel_id) {
      return res.status(404).json({ 
        error: 'Room not found' 
      });
    }
    
    const updatedRoom = await roomService.updateRoom(id, req.body);
    
    res.json({
      message: 'Room updated successfully',
      data: updatedRoom
    });
  });

  /**
   * Delete room
   */
  deleteRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Verify room belongs to the hotel
    const existingRoom = await roomService.getRoomById(id);
    if (existingRoom.hotel_id !== req.hotel.hotel_id) {
      return res.status(404).json({ 
        error: 'Room not found' 
      });
    }
    
    const result = await roomService.deleteRoom(id);
    
    res.json({
      message: result.message
    });
  });

  /**
   * Update room temperature
   */
  updateRoomTemperature = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { temperature } = req.body;
    
    // Verify room belongs to the hotel
    const existingRoom = await roomService.getRoomById(id);
    if (existingRoom.hotel_id !== req.hotel.hotel_id) {
      return res.status(404).json({ 
        error: 'Room not found' 
      });
    }
    
    const result = await roomService.updateRoomTemperature(id, temperature);
    
    res.json({
      message: 'Room temperature updated successfully',
      data: result
    });
  });

  /**
   * Update DND status
   */
  updateDNDStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    
    // Verify room belongs to the hotel
    const existingRoom = await roomService.getRoomById(id);
    if (existingRoom.hotel_id !== req.hotel.hotel_id) {
      return res.status(404).json({ 
        error: 'Room not found' 
      });
    }
    
    const result = await roomService.updateDNDStatus(id, is_active);
    
    res.json({
      message: 'DND status updated successfully',
      data: result
    });
  });
}

module.exports = new RoomController();
