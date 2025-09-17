const express = require('express');
const roomController = require('../controllers/roomController');
const { verifyAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { 
  validateCreateRoom, 
  validateUpdateRoom,
  validateRoomTemperature,
  validateDND
} = require('../validators/roomValidators');

const router = express.Router();

// All routes require authentication
router.use(verifyAuth);

// POST /api/rooms - Create new room
router.post('/', 
  validateBody(validateCreateRoom), 
  roomController.createRoom
);

// GET /api/rooms - Get all rooms for hotel
router.get('/', roomController.getRoomsByHotel);

// GET /api/rooms/:id - Get specific room
router.get('/:id', roomController.getRoomById);

// PUT /api/rooms/:id - Update room
router.put('/:id', 
  validateBody(validateUpdateRoom), 
  roomController.updateRoom
);

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', roomController.deleteRoom);

// PUT /api/rooms/:id/temperature - Update room temperature
router.put('/:id/temperature', 
  validateBody(validateRoomTemperature), 
  roomController.updateRoomTemperature
);

// PUT /api/rooms/:id/dnd - Update DND status
router.put('/:id/dnd', 
  validateBody(validateDND), 
  roomController.updateDNDStatus
);

module.exports = router;
