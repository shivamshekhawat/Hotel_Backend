const hotelModel = require("../models/hotelModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET"; // Ideally from env


const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidPostalCode = (code) => /^\d{5,6}$/.test(code); // 5-6 digit postal code
const isValidYear = (year) => /^\d{4}$/.test(year) && year >= 1800 && year <= new Date().getFullYear();
const isValidPhone = (phone) => /^\d{7,15}$/.test(phone); // 7-15 digits

// ---------------- Signup ----------------
const signup = async (req, res) => {
  try {
    const {
      Name,
      Logo_url,
      Established_year,
      Address,
      "Service care no.": ServiceCareNo,
      City,
      Country,
      Postal_code,
      UserName,
      Password,
    } = req.body;

    // Required fields list
    const requiredFields = {
      Name,
      Logo_url,
      Established_year,
      Address,
      "Service care no.": ServiceCareNo,
      City,
      Country,
      Postal_code,
      UserName,
      Password,
    };

    // 1️⃣ Check missing fields
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || value.toString().trim() === "")
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Missing required field(s): ${missingFields.join(", ")}` });
    }

    // 2️⃣ Validate content formats
    if (Name.length > 20) return res.status(400).json({ error: "Name too long (max 20 chars)" });
    if (!isValidURL(Logo_url)) return res.status(400).json({ error: "Logo_url must be a valid URL" });
    if (!isValidYear(Established_year)) return res.status(400).json({ error: "Established_year must be a valid 4-digit year" });
    if (Address.length > 50) return res.status(400).json({ error: "Address too long (max 50 chars)" });
    if (!isValidPhone(ServiceCareNo)) return res.status(400).json({ error: "Service care no. must be 7-15 digits" });
    if (City.length > 20) return res.status(400).json({ error: "City too long (max 20 chars)" });
    if (Country.length > 20) return res.status(400).json({ error: "Country too long (max 20 chars)" });
    if (!isValidPostalCode(Postal_code)) return res.status(400).json({ error: "Postal_code must be 5-6 digits" });
    if (UserName.length < 3 || UserName.length > 20) return res.status(400).json({ error: "UserName must be 3-20 chars" });
    if (Password.length < 6) return res.status(400).json({ error: "Password must be at least 6 chars" });

    // 3️⃣ Check if username already exists
    const existingHotel = await hotelModel.findHotelByUsername(UserName);
    if (existingHotel) {
      return res.status(400).json({ error: "Hotel with this username already exists" });
    }

    // 4️⃣ Hash password and create hotel
    const hotel = await hotelModel.createHotelWithHash(req.body);

    res.status(201).json({
      message: "Hotel registered successfully",
      hotel_id: hotel.hotel_id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- Login ----------------
const login = async (req, res) => {
  try {
    const { UserName, Password, session_id } = req.body;
    const hotel = await hotelModel.findHotelByUsername(UserName);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

     isMatch = await bcrypt.compare(Password, hotel.password);
    if (!isMatch) isMatch = Password === hotel.password;
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { hotel_id: hotel.hotel_id, session_id: session_id || null },
      JWT_SECRET,
      { expiresIn: 3153600000 } // 100 years in seconds
    );

    await hotelModel.updateToken(hotel.hotel_id, token);

    res.json({
      message: "Login successful",
      hotel_id: hotel.hotel_id,
      token,
      session_id: session_id || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  signup,
  login,
};
