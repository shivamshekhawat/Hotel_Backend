const express = require("express");
const router = express.Router();
const roomServiceController = require("../controllers/roomServiceController");
const { verifyToken } = require("../middleware/authMiddleware");

// Use correct controller function names
router.post("/", verifyToken, roomServiceController.createRoomService);      
router.get("/", verifyToken, roomServiceController.getRoomServices);         // fixed
router.get("/:id", verifyToken, roomServiceController.getRoomService);       // fixed
router.put("/:id", verifyToken, roomServiceController.updateRoomService);    
router.delete("/:id", verifyToken, roomServiceController.deleteRoomService); 

module.exports = router;
