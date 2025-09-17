const Hotel = require('../models/Hotel');
const { generateToken } = require('../../config/jwt');
const { hashPassword, comparePassword } = require('../utils/helpers');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Register a new hotel
   * @param {Object} hotelData - Hotel registration data
   * @returns {Object} Registration result
   */
  async registerHotel(hotelData) {
    try {
      const { UserName, Password, ...otherData } = hotelData;

      // Check if hotel username already exists
      const existingHotel = await Hotel.findByUsername(UserName);
      if (existingHotel) {
        throw new Error('Hotel with this username already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(Password);

      // Create hotel with hashed password
      const hotel = await Hotel.create({
        ...otherData,
        UserName,
        Password: hashedPassword
      });

      logger.info('Hotel registered successfully', { hotel_id: hotel.hotel_id });

      return {
        success: true,
        hotel_id: hotel.hotel_id,
        message: 'Hotel registered successfully'
      };
    } catch (error) {
      logger.error('Hotel registration failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Login hotel
   * @param {String} username - Hotel username
   * @param {String} password - Hotel password
   * @param {String} sessionId - Optional session ID
   * @returns {Object} Login result with token
   */
  async loginHotel(username, password, sessionId = null) {
    try {
      // Find hotel by username
      const hotel = await Hotel.findByUsername(username);
      if (!hotel) {
        throw new Error('Hotel not found');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, hotel.Password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = generateToken({
        hotel_id: hotel.hotel_id,
        session_id: sessionId
      });

      // Update hotel token
      await Hotel.updateToken(hotel.hotel_id, token);

      logger.info('Hotel login successful', { 
        hotel_id: hotel.hotel_id,
        session_id: sessionId 
      });

      return {
        success: true,
        hotel_id: hotel.hotel_id,
        token,
        session_id: sessionId,
        message: 'Login successful'
      };
    } catch (error) {
      logger.error('Hotel login failed', { 
        username,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Change hotel password
   * @param {Number} hotelId - Hotel ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Object} Password change result
   */
  async changePassword(hotelId, currentPassword, newPassword) {
    try {
      // Get hotel data
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        throw new Error('Hotel not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, hotel.Password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await Hotel.updatePassword(hotelId, hashedNewPassword);

      logger.info('Password changed successfully', { hotel_id: hotelId });

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      logger.error('Password change failed', { 
        hotel_id: hotelId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Logout hotel (invalidate token)
   * @param {Number} hotelId - Hotel ID
   * @returns {Object} Logout result
   */
  async logoutHotel(hotelId) {
    try {
      // Clear hotel token
      await Hotel.updateToken(hotelId, null);

      logger.info('Hotel logout successful', { hotel_id: hotelId });

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      logger.error('Hotel logout failed', { 
        hotel_id: hotelId,
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new AuthService();
