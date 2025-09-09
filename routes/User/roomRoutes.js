const express = require("express");
const router = express.Router();
const { sql, pool, poolConnect } = require("../../db");
const fetch = require("node-fetch");
const auth = require('../../middleware/auth');

// -------------------- UTILITIES --------------------

// Normalize boolean values
function normalizeBoolean(input) {
    if (input === true || input === 1 || input === "1" || input === "true") return true;
    if (input === false || input === 0 || input === "0" || input === "false") return false;
    return Boolean(input);
}

// Get room_id from token
function getCallerRoom(req) {
    const user = req.user || {};
    if (!user.room_id) throw new Error('Missing room_id in token');
    return Number(user.room_id);
}

// Parse flexible date formats
function parseFlexibleDate(input) {
    if (!input) return null;
    if (input instanceof Date && !isNaN(input.getTime())) return input;
    if (typeof input === 'number') return new Date(input);
    if (typeof input === 'string') {
        const trimmed = input.trim();
        return new Date(trimmed.includes(' ') ? trimmed.replace(' ', 'T') : trimmed);
    }
    return null;
}

// -------------------- WEATHER --------------------
async function fetchWeatherAndUpdateDB() {
    try {
        await poolConnect;
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=28.0229&longitude=73.3179&current=temperature_2m,weather_code&timezone=auto`
        );
        const data = await response.json();
        if (!data?.current) return;

        const { temperature_2m, weather_code, time } = data.current;
        const weatherMap = {
            0: { type: "Clear Sky", img: "/image/sunny.png" },
            1: { type: "Mainly Clear", img: "/image/pcloudy.png" },
            2: { type: "Partly Cloudy", img: "/image/pcloudy.png" },
            3: { type: "Overcast", img: "/image/mcloudy.png" },
            45: { type: "Fog", img: "/image/Foggy.png" },
            48: { type: "Depositing Rime Fog", img: "/image/wind.png" },
            51: { type: "Light Drizzle", img: "/image/Lrain.png" },
            61: { type: "Rain", img: "/image/Rain.png" },
            71: { type: "Snow", img: "/image/Snow.png" },
            80: { type: "Rain Showers", img: "/image/Sleet.png" },
            95: { type: "Thunderstorm", img: "/image/TStorm.png" },
        };
        const weatherInfo = weatherMap[weather_code] || { type: "Unknown", img: "https://example.com/default.png" };

        await pool.request()
            .input("weather_time", sql.DateTime, new Date(time))
            .input("temperature_2m", sql.Float, temperature_2m)
            .input("weather_code", sql.Int, weather_code)
            .input("weather_type", sql.VarChar, weatherInfo.type)
            .input("weather_image", sql.VarChar, weatherInfo.img)
            .query(`
                IF EXISTS (SELECT 1 FROM Weather WHERE Weather_Id = 1)
                    UPDATE Weather
                    SET weather_time = @weather_time,
                        temperature_2m = @temperature_2m,
                        weather_code = @weather_code,
                        weather_type = @weather_type,
                        weather_image = @weather_image
                    WHERE Weather_Id = 1
                ELSE
                    INSERT INTO Weather (Weather_time, temperature_2m, weather_code, weather_type, weather_image)
                    VALUES (@weather_time, @temperature_2m, @weather_code, @weather_type, @weather_image)
            `);

        console.log("✅ Weather updated in DB");
    } catch (err) {
        console.error("❌ Weather update failed:", err.message);
    }
}

// -------------------- ROOM DETAILS --------------------
async function getRoomColumnName() {
    await poolConnect;
    const result = await pool
        .request()
        .input("table", sql.VarChar, "Rooms")
        .query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME=@table
        `);

    const names = result.recordset.map(row => String(row.COLUMN_NAME).toLowerCase());
    if (names.includes('roomno')) return 'roomNo';
    if (names.includes('room_id')) return 'room_id';
    if (names.includes('roomid')) return 'room_id';
    if (names.includes('room_no')) return 'roomNo';
    if (names.includes('roomnumber')) return 'roomNo';
    // Fallback: check singular table name
    const resultSingular = await pool
        .request()
        .input("table", sql.VarChar, "Room")
        .query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME=@table
        `);
    const names2 = resultSingular.recordset.map(row => String(row.COLUMN_NAME).toLowerCase());
    if (names2.includes('roomno')) return 'roomNo';
    if (names2.includes('room_id') || names2.includes('roomid')) return 'room_id';
    throw new Error('Rooms/Room table missing room identifier column (room_id/roomNo/variants)');
}

async function getRoomDetails(room_id) {
    await poolConnect;

    const roomColumn = await getRoomColumnName();

    const baseColumns = [
        'logo_url','client_name','number_of_adults','number_of_children',
        'language','current_ac_temp','is_checked_in','check_in_time','check_out_time',
        'is_dnd_on','master_light','master_curtain','master_window','reading_light',
        'service_care_number','unread_notification','greeting_message','type','floor',
        'status','capacity'
    ];

    const selectColumns = [
        roomColumn === 'room_id' ? 'room_id' : 'roomNo AS room_id',
        ...baseColumns
    ].join(', ');

    // Diagnostics: log sample identifiers
    try {
        const sample = await pool.request().query(`SELECT TOP 5 ${roomColumn} AS col FROM Rooms`);
        console.log('[roomRoutes] Rooms sample identifiers:', sample.recordset.map(r => r.col));
    } catch (e) {
        try {
            const sampleS = await pool.request().query(`SELECT TOP 5 ${roomColumn} AS col FROM Room`);
            console.log('[roomRoutes] Room sample identifiers:', sampleS.recordset.map(r => r.col));
        } catch (e2) {
            console.warn('[roomRoutes] Unable to sample identifiers from Rooms/Room:', e2.message);
        }
    }

    // First try using detected column and appropriate type against Rooms
    let result;
    if (roomColumn === 'room_id') {
        result = await pool.request()
            .input('room_value', sql.Int, Number(room_id))
            .query(`SELECT TOP 1 ${selectColumns} FROM Rooms WHERE room_id = @room_value`);
    } else {
        // Try exact match on trimmed string or numeric comparison
        result = await pool.request()
            .input('room_value_str', sql.VarChar, String(room_id))
            .input('room_value_int', sql.Int, Number(room_id))
            .query(`
                SELECT TOP 1 ${selectColumns}
                FROM Rooms
                WHERE LTRIM(RTRIM(roomNo)) = @room_value_str
                   OR TRY_CAST(LTRIM(RTRIM(roomNo)) AS INT) = @room_value_int
            `);
    }

    // Fallbacks: try both variants explicitly if no rows
    if (!result.recordset || result.recordset.length === 0) {
        console.warn('[roomRoutes] Primary Rooms lookup returned 0 rows, trying fallbacks...');
        const tryById = await pool.request()
            .input('id_value', sql.Int, Number(room_id))
            .query(`SELECT TOP 1 room_id, ${baseColumns.join(', ')} FROM Rooms WHERE room_id = @id_value`);
        if (tryById.recordset && tryById.recordset.length > 0) {
            result = tryById;
        } else {
            const tryByNo = await pool.request()
                .input('no_value', sql.VarChar, String(room_id))
                .input('no_value_int', sql.Int, Number(room_id))
                .query(`
                    SELECT TOP 1 roomNo AS room_id, ${baseColumns.join(', ')}
                    FROM Rooms
                    WHERE LTRIM(RTRIM(roomNo)) = @no_value
                       OR TRY_CAST(LTRIM(RTRIM(roomNo)) AS INT) = @no_value_int
                `);
            if (tryByNo.recordset && tryByNo.recordset.length > 0) {
                result = tryByNo;
            }
        }
    }

    // Fallback to singular table name 'Room'
    if (!result || !result.recordset || result.recordset.length === 0) {
        console.warn('[roomRoutes] Fallback to singular table Room...');
        if (roomColumn === 'room_id') {
            const s1 = await pool.request()
                .input('room_value', sql.Int, Number(room_id))
                .query(`SELECT TOP 1 ${selectColumns} FROM Room WHERE room_id = @room_value`);
            if (s1.recordset && s1.recordset.length > 0) {
                result = s1;
            }
        }
        if (!result || !result.recordset || result.recordset.length === 0) {
            const s2 = await pool.request()
                .input('no_value', sql.VarChar, String(room_id))
                .input('no_value_int', sql.Int, Number(room_id))
                .query(`
                    SELECT TOP 1 roomNo AS room_id, ${baseColumns.join(', ')}
                    FROM Room
                    WHERE LTRIM(RTRIM(roomNo)) = @no_value
                       OR TRY_CAST(LTRIM(RTRIM(roomNo)) AS INT) = @no_value_int
                `);
            if (s2.recordset && s2.recordset.length > 0) {
                result = s2;
            }
        }
    }

    const room = result.recordset[0];
    console.log(`[roomRoutes] getRoomDetails: room_id=${room_id}, rows=${result.recordset?.length || 0}, column=${roomColumn}`);
    if (!room) return null;

    const weatherResult = await pool.request()
        .query(`SELECT TOP 1 weather_time, temperature_2m, weather_code, weather_type, weather_image FROM Weather ORDER BY weather_time DESC`);

    return { room, weather: weatherResult.recordset[0] || null };
}

// -------------------- ROUTES --------------------

// GET Room Details
router.get("/:room_id", auth, async (req, res) => {
    try {
        const { room_id } = req.params;
        const room_id_from_token = getCallerRoom(req);

        if (Number(room_id_from_token) !== Number(room_id)) {
            return res.status(403).json({ message: 'Access denied. You can only view your assigned room.' });
        }

        const dashboardData = await getRoomDetails(room_id_from_token);
        if (!dashboardData) {
            console.warn(`[roomRoutes] GET /:room_id -> no room found. token_room_id=${room_id_from_token}, param_room_id=${room_id}`);
            return res.status(404).json({ message: "Room not found" });
        }

        res.status(200).json(dashboardData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /action
router.post("/action", auth, async (req, res) => {
    try {
        const room_id_from_token = getCallerRoom(req);
        const requested_room_id = req.body.room_id;

        if (requested_room_id !== undefined && Number(requested_room_id) !== room_id_from_token) {
            return res.status(403).json({ message: "Unauthorized: token does not match requested room." });
        }

        const { is_checked_in, is_check_in, is_dnd_on, lightning_control = {}, check_in_time, check_out_time } = req.body;
        const checkedIn = normalizeBoolean(is_checked_in !== undefined ? is_checked_in : is_check_in);

        const {
            master_light = false,
            master_curtain = false,
            master_window = false,
            reading_light = false
        } = lightning_control;

        const new_check_in_time = checkedIn ? (check_in_time ? parseFlexibleDate(check_in_time) : new Date()) : null;
        const new_check_out_time = check_out_time ? parseFlexibleDate(check_out_time) : null;

        await pool.request()
            .input('is_dnd_on', sql.Int, is_dnd_on ? 1 : 0)
            .input('is_checked_in', sql.Int, checkedIn ? 1 : 0)
            .input('check_in_time', sql.DateTime, new_check_in_time)
            .input('check_out_time', sql.DateTime, new_check_out_time)
            .input('master_light', sql.Int, master_light ? 1 : 0)
            .input('master_curtain', sql.Int, master_curtain ? 1 : 0)
            .input('master_window', sql.Int, master_window ? 1 : 0)
            .input('reading_light', sql.Int, reading_light ? 1 : 0)
            .input('room_id', sql.Int, room_id_from_token)
            .query(`
                UPDATE Rooms
                SET
                    is_dnd_on = @is_dnd_on,
                    is_checked_in = @is_checked_in,
                    check_in_time = @check_in_time,
                    check_out_time = @check_out_time,
                    master_light = @master_light,
                    master_curtain = @master_curtain,
                    master_window = @master_window,
                    reading_light = @reading_light
                WHERE room_id = @room_id
            `);

        const updatedDashboard = await getRoomDetails(room_id_from_token);
        return res.status(200).json(updatedDashboard);

    } catch (err) {
        console.error("Error in /action:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});

// -------------------- EXPORT --------------------
module.exports = router;
module.exports.fetchWeatherAndUpdateDB = fetchWeatherAndUpdateDB;
