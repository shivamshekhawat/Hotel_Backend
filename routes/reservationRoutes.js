
const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");

// Create a new reservation
router.post("/", reservationController.createReservation);

// Get all reservations with optional hotel filtering
// GET /api/reservations - gets all reservations
// GET /api/reservations?hotel_id=93 - gets reservations for hotel with ID 93
// GET /api/reservations/hotel/93 - alternative way to get reservations by hotel ID
router.get(["/", "/hotel/:hotelId"], reservationController.getReservations);

// Get, update, or delete a specific reservation
router.get("/:id", reservationController.getReservation);
router.put("/:id", reservationController.updateReservation);
router.delete("/:id", reservationController.deleteReservation);

module.exports = router;
