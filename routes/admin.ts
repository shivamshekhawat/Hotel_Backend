import express from 'express';
import { updateAdmin } from '../controllers/adminController';

const router = express.Router();

// Update admin route - PUT /api/admin/:id
router.put('/:id', updateAdmin);

export default router;