const { sql } = require("../db");

// Create a new language
async function createLanguage(data) {
  const { language_code, language_name } = data;

  if (!language_code || !language_name) {
    const err = new Error("language_code and language_name are required");
    err.statusCode = 400;
    throw err;
  }

  // Normalize the code to avoid case-sensitivity duplicates
  const codeNormalized = language_code.trim().toUpperCase();

  // 1) check duplicates using a fresh request
  const checkReq = new sql.Request();
  const existing = await checkReq
    .input("language_code", sql.NVarChar, codeNormalized)
    .query(`SELECT language_id FROM Languages WHERE UPPER(language_code) = @language_code`);

  if (existing.recordset.length > 0) {
    const err = new Error(`Language code '${codeNormalized}' already exists`);
    err.statusCode = 409; // Conflict
    throw err;
  }

  // 2) insert with a fresh request
  const insertReq = new sql.Request();
  const result = await insertReq
    .input("language_code", sql.NVarChar, codeNormalized)
    .input("language_name", sql.NVarChar, language_name)
    .query(`
      INSERT INTO Languages (language_code, language_name)
      OUTPUT inserted.*
      VALUES (@language_code, @language_name)
    `);

  return result.recordset[0];
}


// Get all languages
async function getAllLanguages() {
  const request = new sql.Request();
  const result = await request.query("SELECT * FROM Languages");
  return result.recordset;
}

// Get language by ID
async function getLanguageById(language_id) {
  const request = new sql.Request();
  const result = await request
    .input("language_id", sql.Int, language_id)
    .query("SELECT * FROM Languages WHERE language_id=@language_id");
  return result.recordset[0];
}

// Update language
async function updateLanguage(language_id, data) {
  const { language_code, language_name } = data;

  if (!language_code || !language_name) {
    throw new Error("language_code and language_name are required");
  }

  // 1️⃣ Check for duplicate (case-insensitive)
  const checkRequest = new sql.Request();
  const duplicateCheck = await checkRequest
    .input("language_code", sql.NVarChar, language_code)
    .input("language_id", sql.Int, language_id)
    .query(`
      SELECT * FROM Languages 
      WHERE LOWER(language_code) = LOWER(@language_code)
      AND language_id <> @language_id
    `);

  if (duplicateCheck.recordset.length > 0) {
    throw new Error(`Language code '${language_code}' already exists`);
  }

  // 2️⃣ Update language
  const updateRequest = new sql.Request();
  await updateRequest
    .input("language_id", sql.Int, language_id)
    .input("language_code", sql.NVarChar, language_code)
    .input("language_name", sql.NVarChar, language_name)
    .query(`
      UPDATE Languages
      SET language_code=@language_code,
          language_name=@language_name
      WHERE language_id=@language_id
    `);

  return getLanguageById(language_id);
}

// Delete language
async function deleteLanguage(language_id) {
  const request = new sql.Request();
  await request
    .input("language_id", sql.Int, language_id)
    .query("DELETE FROM Languages WHERE language_id=@language_id");
  return true;
}

module.exports = {
  createLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
};
