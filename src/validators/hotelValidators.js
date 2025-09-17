const Joi = require('joi');

const createHotelSchema = Joi.object({
  hotel_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  contact_number: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
  address: Joi.string().max(500).optional(),
  description: Joi.string().max(1000).optional(),
  amenities: Joi.array().items(Joi.string()).optional()
});

const updateHotelSchema = Joi.object({
  hotel_name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  contact_number: Joi.string().pattern(/^[0-9+\-\s()]+$/),
  address: Joi.string().max(500),
  description: Joi.string().max(1000),
  amenities: Joi.array().items(Joi.string())
}).min(1); // At least one field required

const validateCreateHotel = (data) => createHotelSchema.validate(data);
const validateUpdateHotel = (data) => updateHotelSchema.validate(data);

module.exports = {
  validateCreateHotel,
  validateUpdateHotel
};
