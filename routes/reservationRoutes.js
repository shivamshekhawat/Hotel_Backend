
const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");

router.post("/", reservationController.createReservation);       // Create
router.get("/", reservationController.getReservations);           // Get all
router.get("/:id", reservationController.getReservation);        // Get by ID
router.put("/:id", reservationController.updateReservation);     // Update
router.delete("/:id", reservationController.deleteReservation);  // Delete

module.exports = router;
