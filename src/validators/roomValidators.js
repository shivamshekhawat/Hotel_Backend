const Joi = require('joi');

const createRoomSchema = Joi.object({
  hotel_id: Joi.number().integer().positive().required(),
  room_number: Joi.string().min(1).max(10).required(),
  room_type: Joi.string().valid('Standard', 'Deluxe', 'Suite', 'Presidential').default('Standard'),
  price: Joi.number().positive().default(0),
  availability: Joi.boolean().default(true),
  capacity_adults: Joi.number().integer().min(1).max(10).default(2),
  capacity_children: Joi.number().integer().min(0).max(5).default(0),
  password: Joi.string().min(4).max(20).optional()
});

const updateRoomSchema = Joi.object({
  room_number: Joi.string().min(1).max(10),
  room_type: Joi.string().valid('Standard', 'Deluxe', 'Suite', 'Presidential'),
  price: Joi.number().positive(),
  availability: Joi.boolean(),
  capacity_adults: Joi.number().integer().min(1).max(10),
  capacity_children: Joi.number().integer().min(0).max(5),
  password: Joi.string().min(4).max(20)
}).min(1); // At least one field required

const roomTemperatureSchema = Joi.object({
  temperature: Joi.number().min(16).max(30).required()
});

const dndSchema = Joi.object({
  is_active: Joi.boolean().required()
});

const validateCreateRoom = (data) => createRoomSchema.validate(data);
const validateUpdateRoom = (data) => updateRoomSchema.validate(data);
const validateRoomTemperature = (data) => roomTemperatureSchema.validate(data);
const validateDND = (data) => dndSchema.validate(data);

module.exports = {
  validateCreateRoom,
  validateUpdateRoom,
  validateRoomTemperature,
  validateDND
};
