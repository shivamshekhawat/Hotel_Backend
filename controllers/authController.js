const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sql, poolConnect, pool } = require("../db.js");
const { sendNotification } = require("../utils/fcmService.js");

// ----------------- HELPER FUNCTIONS -----------------
async function columnExists(tableName, columnName) {
  await poolConnect;
  const result = await pool
    .request()
    .input("table", sql.VarChar, tableName)
    .input("column", sql.VarChar, columnName)
    .query(`
      SELECT COUNT(*) AS cnt 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME=@table AND COLUMN_NAME=@column
    `);
  return (result.recordset[0]?.cnt ?? 0) > 0;
}

async function resolveRoomsRoomColumn() {
  if (await columnExists("Rooms", "roomNo")) return "roomNo";
  if (await columnExists("Rooms", "room_id")) return "room_id";
  throw new Error("Rooms table has neither room_id nor roomNo column");
}

async function resolveUsersRoomColumn() {
  if (await columnExists("Users", "roomNo")) return "roomNo";
  if (await columnExists("Users", "room_id")) return "room_id";
  throw new Error("Users table has neither room_id nor roomNo column");
}

// ----------------- SIGNUP -----------------
// ----------------- SIGNUP -----------------
// ----------------- SIGNUP -----------------
exports.signup = async (req, res) => {
  try {
    let { user_id, password, roomNo } = req.body;

    user_id = (user_id ?? "").trim();
    password = (password ?? "").trim();
    roomNo = (roomNo ?? "").toString().trim();

    // All fields empty
    if (!user_id && !password && !roomNo) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Individual field checks
    if (!user_id) return res.status(400).json({ message: "User ID is required!" });
    if (!password) return res.status(400).json({ message: "Password is required!" });
    if (!roomNo) return res.status(400).json({ message: "Room number is required!" });

    // User ID validation
    if (!/^[a-zA-Z0-9]+$/.test(user_id)) {
      return res.status(400).json({ message: "User ID must be alphanumeric." });
    }

    // Room number validation
    if (!/^\d{1,4}$/.test(roomNo)) {
      return res.status(400).json({ message: "Room number must be 1-4 digits." });
    }

    // Password validation: 6-12 chars, no spaces, at least 1 letter, 1 number, 1 special char
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,12}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 6-12 characters long, include at least one letter, one number, and one special character."
      });
    }

    await poolConnect;

    const roomsRoomCol = await resolveRoomsRoomColumn();
    const usersRoomCol = await resolveUsersRoomColumn();

    // Check if room exists or create it
    let roomRow;
    const roomReq = pool.request();
    if (roomsRoomCol === "roomNo") {
      roomReq.input("room_value", sql.VarChar, roomNo);
      const roomResult = await roomReq.query(`SELECT TOP 1 * FROM dbo.Rooms WHERE roomNo=@room_value`);
      if (!roomResult.recordset.length) {
        const insertRoomReq = pool.request().input("room_value", sql.VarChar, roomNo);
        const newRoom = await insertRoomReq.query(`
          INSERT INTO dbo.Rooms (roomNo)
          OUTPUT INSERTED.*
          VALUES (@room_value)
        `);
        roomRow = newRoom.recordset[0];
      } else {
        roomRow = roomResult.recordset[0];
      }
    } else {
      // roomsRoomCol === "room_id" → identity column
      const roomResult = await pool.request().query(`SELECT TOP 1 * FROM dbo.Rooms`);
      if (!roomResult.recordset.length) {
        // No room exists yet → insert default row
        const newRoom = await pool.request().query(`
          INSERT INTO dbo.Rooms DEFAULT VALUES
          OUTPUT INSERTED.*
        `);
        roomRow = newRoom.recordset[0];
      } else {
        roomRow = roomResult.recordset[0]; // use first room
      }
    }

    // Determine room value for Users table
    const usersRoomValue = usersRoomCol === "room_id" ? roomRow.room_id : String(roomNo);

    // Check if user_id or room already exists
    const existingReq = pool.request().input("user_id", sql.VarChar, user_id);
    if (usersRoomCol === "roomNo") {
      existingReq.input("room_value", sql.VarChar, String(usersRoomValue));
    } else {
      existingReq.input("room_value", sql.Int, Number(usersRoomValue));
    }

    const existing = await existingReq.query(`
      SELECT TOP 1 * FROM dbo.Users WHERE user_id=@user_id OR ${usersRoomCol}=@room_value
    `);

    if (existing.recordset.length > 0) {
      const e = existing.recordset[0];
      if (e.user_id === user_id) return res.status(400).json({ message: "User ID already exists" });
      if (e[usersRoomCol] === usersRoomValue) return res.status(400).json({ message: "Room is already allocated" });
    }

    // Insert new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertReq = pool.request()
      .input("user_id", sql.VarChar, user_id)
      .input("password", sql.VarChar, hashedPassword);

    if (usersRoomCol === "roomNo") {
      insertReq.input("room_value", sql.VarChar, String(usersRoomValue));
    } else {
      insertReq.input("room_value", sql.Int, Number(usersRoomValue));
    }

    await insertReq.query(`
      INSERT INTO dbo.Users (user_id, password, ${usersRoomCol}, token_version, fcm_token, device_id)
      VALUES (@user_id, @password, @room_value, 0, NULL, NULL)
    `);

    return res.status(200).json({ message: "User registered successfully" });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};


// ----------------- SIGNIN -----------------
exports.signin = async (req, res) => {
  try {
    let { user_id, password, fcm_token, device_id } = req.body;

    user_id = (user_id || "").trim();
    password = (password || "").trim();
    fcm_token = (fcm_token || "").trim();
    device_id = (device_id || "").trim();

    const tokenPreview = fcm_token
      ? `${fcm_token.slice(0, 12)}...${fcm_token.slice(-6)}`
      : "<empty>";
    console.log(
      `[FCM] signin request for user_id=${user_id} device_id=${device_id} token=${tokenPreview}`
    );

    // ✅ Validate required fields one by one
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required!" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required!" });
    }
    if (!fcm_token) {
      return res.status(400).json({ message: "FCM token is required!" });
    }
    if (!device_id) {
      return res.status(400).json({ message: "Device ID is required!" });
    }

    // ✅ User ID validation
    if (!/^[a-zA-Z0-9]+$/.test(user_id)) {
      return res.status(400).json({ message: "User ID must be alphanumeric." });
    }

    await poolConnect;

    // ✅ Fetch user from DB
    const result = await pool
      .request()
      .input("user_id", sql.VarChar, user_id)
      .query(`SELECT TOP 1 * FROM dbo.Users WHERE user_id=@user_id`);

    const user = result.recordset[0];
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Compare password with hashed value
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Device & FCM handling
    const hadPrevDevice = !!user.device_id;
    const takeover = hadPrevDevice && user.device_id !== device_id;
    const freshDevice = !hadPrevDevice;
    const oldFcmToken = user.fcm_token;

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const reqTx = new sql.Request(tx);
      await reqTx
        .input("id", sql.Int, user.id)
        .input("fcm_token", sql.VarChar, fcm_token)
        .input("device_id", sql.VarChar, device_id)
        .query(`
          UPDATE dbo.Users
          SET fcm_token=@fcm_token,
              device_id=@device_id,
              token_version = token_version + 1
          WHERE id=@id
        `);
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }

    // ✅ Determine room identifiers using Users table
    const usersRoomCol = await resolveUsersRoomColumn();
    let roomValue = "";
    let roomIdValue = null;

    if (usersRoomCol === "roomNo") {
      roomValue = String(user.roomNo ?? "");
      roomIdValue = roomValue || null;
    } else {
      roomIdValue = user.room_id ?? null;
      roomValue = String(roomIdValue ?? "");
    }

    // ✅ Send notifications
    if (takeover && oldFcmToken?.trim()) {
      sendNotification(
        oldFcmToken,
        "You have been logged out: account active on another device."
      )
        .then((id) =>
          console.log(`[FCM] logout notice sent to old device: ${id}`)
        )
        .catch((err) =>
          console.error("[FCM] failed to notify old device:", err?.message || err)
        );
    }

    if (fcm_token?.trim()) {
      let msg = "Signed in successfully";
      if (freshDevice) msg = "New device logged in.";
      if (takeover) msg = "New device logged in. Previous device was logged out.";
      sendNotification(fcm_token, msg)
        .then((id) =>
          console.log(`[FCM] signin notice sent to new device: ${id}`)
        )
        .catch((err) =>
          console.error("[FCM] failed to notify new device:", err?.message || err)
        );
    }

    // ✅ Generate JWT
    const newTokenVersion = (user.token_version ?? 0) + 1;
    const token = jwt.sign(
      {
        id: user.id,
        user_id: user.user_id,
        roomNo: roomValue || undefined,
        room_id:
          roomIdValue != null ? String(roomIdValue) : roomValue || "",
        token_version: newTokenVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      message: "Login successful",
      roomNo: roomValue,
    });
  } catch (err) {
    console.error("Signin error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Server error" });
  }
};





// ----------------- LOGOUT -----------------
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await pool.request()
      .input("id", sql.Int, userId)
      .query(`
        UPDATE dbo.Users
        SET token_version = token_version + 1,
            fcm_token = NULL,
            device_id = NULL
        WHERE id=@id
      `);

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
