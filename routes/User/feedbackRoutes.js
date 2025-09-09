const express = require('express');
const router = express.Router();
const { sql } = require('../../db');
const auth = require('../../middleware/auth');

const MAX_COMMENT_LENGTH = 200;

router.post('/', auth, async (req, res) => {
    try {
        // Normalize to an array
        const feedbacks = Array.isArray(req.body) ? req.body : [req.body];
        const insertedIds = [];

        for (let f of feedbacks) {
            let { comment, rating, room_id: bodyRoomId } = f;

            // Trim and validate comment
            if (!comment || !comment.trim()) {
                return res.status(400).json({
                    status: 'ERROR',
                    message: "Field 'comment' is required and cannot be empty."
                });
            }
            comment = comment.trim();

            const commentPattern = /^[a-zA-Z0-9\s.,!?'"()-]*$/;
            if (!commentPattern.test(comment)) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Field 'comment' contains invalid characters."
                });
            }

            if (comment.length > MAX_COMMENT_LENGTH) {
                return res.status(400).json({
                    status: 'ERROR',
                    message: `Field 'comment' cannot exceed ${MAX_COMMENT_LENGTH} characters.`
                });
            }

            // Validate rating as integer
            rating = parseInt(rating, 10);
            if (isNaN(rating) || rating < 1 || rating > 5) {
                return res.status(400).json({
                    status: 'ERROR',
                    message: "Field 'rating' must be an integer between 1 and 5."
                });
            }

            // Validate room binding
            const tokenRoomId = req.user?.room_id ?? req.user?.room_number ?? (Array.isArray(req.user?.rooms) ? req.user.rooms[0] : undefined);
            if (bodyRoomId !== undefined && String(bodyRoomId) !== String(tokenRoomId)) {
                return res.status(403).json({
                    status: 'ERROR',
                    message: 'Forbidden: room_id does not match token room.'
                });
            }

            const room_id = tokenRoomId;

            // Insert feedback
            const result = await sql.query`
                INSERT INTO Feedback (room_id, comment, rating)
                VALUES (${room_id}, ${comment}, ${rating});

                SELECT SCOPE_IDENTITY() AS feedback_id;
            `;

            insertedIds.push(result.recordset[0].feedback_id);
        }

        res.status(201).json({
            feedback_ids: insertedIds,
            status: 'Success',
            message: 'Thanks For Your Feedback!'
        });

    } catch (err) {
        console.error("Feedback Error:", err);
        res.status(500).json({ status: 'ERROR', message: err.message });
    }
});


module.exports = router;
