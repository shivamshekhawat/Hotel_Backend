const Room = require('../models/Room');
const RoomTemperature = require('../models/RoomTemperature');
const DND = require('../models/DND');
const { sendNotification } = require('../../config/firebase');
const logger = require('../utils/helpers');

class RoomService {
  /**
   * Create a new room
   * @param {Object} roomData - Room data
   * @returns {Object} Created room
   */
  async createRoom(roomData) {
    try {
      const { hotel_id, room_number, ...otherData } = roomData;

      // Check for duplicate room number in the same hotel
      const existingRoom = await Room.findByHotelAndNumber(hotel_id, room_number);
      if (existingRoom) {
        throw new Error(`Room ${room_number} already exists for this hotel`);
      }

      // Create room
      const room = await Room.create(roomData);

      // Create default room temperature and DND settings
      await this.createRoomDefaults(room.room_id);

      logger.info('Room created successfully', { 
        room_id: room.room_id,
        hotel_id: hotel_id,
        room_number: room_number 
      });

      return {
        success: true,
        data: room,
        message: 'Room created successfully with default settings'
      };
    } catch (error) {
      logger.error('Room creation failed', { 
        error: error.message,
        roomData 
      });
      throw error;
    }
  }

  /**
   * Get all rooms for a hotel
   * @param {Number} hotelId - Hotel ID
   * @returns {Array} List of rooms
   */
  async getRoomsByHotel(hotelId) {
    try {
      const rooms = await Room.findByHotel(hotelId);
      
      logger.info('Rooms retrieved successfully', { 
        hotel_id: hotelId,
        count: rooms.length 
      });

      return rooms;
    } catch (error) {
      logger.error('Failed to retrieve rooms', { 
        hotel_id: hotelId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get room by ID
   * @param {Number} roomId - Room ID
   * @returns {Object} Room data
   */
  async getRoomById(roomId) {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      return room;
    } catch (error) {
      logger.error('Failed to retrieve room', { 
        room_id: roomId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update room
   * @param {Number} roomId - Room ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated room
   */
  async updateRoom(roomId, updateData) {
    try {
      // Check if room exists
      const existingRoom = await Room.findById(roomId);
      if (!existingRoom) {
        throw new Error('Room not found');
      }

      // Check for duplicate room number if room_number is being updated
      if (updateData.room_number && updateData.room_number !== existingRoom.room_number) {
        const duplicateRoom = await Room.findByHotelAndNumber(existingRoom.hotel_id, updateData.room_number);
        if (duplicateRoom) {
          throw new Error(`Room ${updateData.room_number} already exists for this hotel`);
        }
      }

      // Update room
      const updatedRoom = await Room.update(roomId, updateData);

      logger.info('Room updated successfully', { 
        room_id: roomId,
        updated_fields: Object.keys(updateData) 
      });

      return updatedRoom;
    } catch (error) {
      logger.error('Room update failed', { 
        room_id: roomId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Delete room
   * @param {Number} roomId - Room ID
   * @returns {Object} Deletion result
   */
  async deleteRoom(roomId) {
    try {
      // Check if room exists
      const existingRoom = await Room.findById(roomId);
      if (!existingRoom) {
        throw new Error('Room not found');
      }

      // Delete related records first
      await this.deleteRoomDefaults(roomId);

      // Delete room
      await Room.delete(roomId);

      logger.info('Room deleted successfully', { room_id: roomId });

      return {
        success: true,
        message: 'Room deleted successfully along with related records'
      };
    } catch (error) {
      logger.error('Room deletion failed', { 
        room_id: roomId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update room temperature
   * @param {Number} roomId - Room ID
   * @param {Number} temperature - New temperature
   * @returns {Object} Update result
   */
  async updateRoomTemperature(roomId, temperature) {
    try {
      const result = await RoomTemperature.updateByRoom(roomId, { temperature });

      logger.info('Room temperature updated', { 
        room_id: roomId,
        temperature 
      });

      return result;
    } catch (error) {
      logger.error('Room temperature update failed', { 
        room_id: roomId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update DND status
   * @param {Number} roomId - Room ID
   * @param {Boolean} isActive - DND status
   * @returns {Object} Update result
   */
  async updateDNDStatus(roomId, isActive) {
    try {
      const result = await DND.updateByRoom(roomId, { is_active: isActive });

      logger.info('DND status updated', { 
        room_id: roomId,
        is_active: isActive 
      });

      return result;
    } catch (error) {
      logger.error('DND status update failed', { 
        room_id: roomId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Create default room settings
   * @param {Number} roomId - Room ID
   * @private
   */
  async createRoomDefaults(roomId) {
    try {
      await Promise.all([
        RoomTemperature.create({ 
          room_id: roomId, 
          temperature: 24.0 
        }),
        DND.create({ 
          room_id: roomId, 
          is_active: false 
        })
      ]);
    } catch (error) {
      logger.error('Failed to create room defaults', { 
        room_id: roomId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Delete room default settings
   * @param {Number} roomId - Room ID
   * @private
   */
  async deleteRoomDefaults(roomId) {
    try {
      await Promise.all([
        RoomTemperature.deleteByRoom(roomId),
        DND.deleteByRoom(roomId)
      ]);
    } catch (error) {
      logger.error('Failed to delete room defaults', { 
        room_id: roomId,
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new RoomService();
