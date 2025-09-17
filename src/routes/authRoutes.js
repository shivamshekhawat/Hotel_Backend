const express = require('express');
const authController = require('../controllers/authController');
const { verifyAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { 
  validateRegister, 
  validateLogin, 
  validateChangePassword 
} = require('../validators/authValidators');

const router = express.Router();

// POST /api/auth/register - Register new hotel
router.post('/register', 
  validateBody(validateRegister), 
  authController.register
);

// POST /api/auth/login - Login hotel
router.post('/login', 
  validateBody(validateLogin), 
  authController.login
);

// PUT /api/auth/change-password - Change password (requires auth)
router.put('/change-password', 
  verifyAuth,
  validateBody(validateChangePassword), 
  authController.changePassword
);

// POST /api/auth/logout - Logout hotel (requires auth)
router.post('/logout', 
  verifyAuth, 
  authController.logout
);

module.exports = router;
