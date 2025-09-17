const { sql } = require("../db");

// Create a new language
async function createLanguage(data) {
  const { language_code, language_name } = data;

  if (!language_code || !language_name) {
    throw new Error("language_code and language_name are required");
  }

  const request = new sql.Request();

  // Check for duplicate (case-insensitive)
  const existing = await request
    .input("language_code", sql.NVarChar, language_code)
    .query("SELECT * FROM Languages WHERE LOWER(language_code) = LOWER(@language_code)");

  if (existing.recordset.length > 0) {
    throw new Error(`Language code '${language_code}' already exists`);
  }

  // Insert new language
  const result = await request
    .input("language_code", sql.NVarChar, language_code)
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

  const request = new sql.Request();

  // Check for duplicate language_code excluding current record (case-insensitive)
  const duplicateCheck = await request
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

  // Update language
  await request
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
