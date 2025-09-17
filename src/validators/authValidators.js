const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  hotel_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(20).required(),
  contact_number: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
  address: Joi.string().max(500).optional()
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).max(20).required()
});

const validateLogin = (data) => loginSchema.validate(data);
const validateRegister = (data) => registerSchema.validate(data);
const validateChangePassword = (data) => changePasswordSchema.validate(data);

module.exports = {
  validateLogin,
  validateRegister,
  validateChangePassword
};
