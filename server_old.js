const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  return res.json("Hi I am backend");
});



app.get("/emplo", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM Employees");
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Database connection failed" });
  }
});

app.listen(3000, () => {
  console.log("The Server Has Started!");
});
