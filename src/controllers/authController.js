const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

class AuthController {
  /**
   * Register a new hotel
   */
  register = asyncHandler(async (req, res) => {
    const result = await authService.registerHotel(req.body);
    
    res.status(201).json({
      message: result.message,
      hotel_id: result.hotel_id
    });
  });

  /**
   * Login hotel
   */
  login = asyncHandler(async (req, res) => {
    const { UserName, Password, session_id } = req.body;
    const result = await authService.loginHotel(UserName, Password, session_id);
    
    res.json({
      message: result.message,
      hotel_id: result.hotel_id,
      token: result.token,
      session_id: result.session_id
    });
  });

  /**
   * Change password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body;
    const hotelId = req.hotel.hotel_id;
    
    const result = await authService.changePassword(hotelId, current_password, new_password);
    
    res.json({
      message: result.message
    });
  });

  /**
   * Logout hotel
   */
  logout = asyncHandler(async (req, res) => {
    const hotelId = req.hotel.hotel_id;
    const result = await authService.logoutHotel(hotelId);
    
    res.json({
      message: result.message
    });
  });
}

module.exports = new AuthController();
