const { sql } = require("../db");

// Helper: format Date as "YYYY-MM-DD HH:mm:ss"
function formatDate(date) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  return (
    date.getFullYear() +
    "-" + pad(date.getMonth() + 1) +
    "-" + pad(date.getDate()) +
    " " + pad(date.getHours()) +
    ":" + pad(date.getMinutes()) +
    ":" + pad(date.getSeconds())
  );
}

// ✅ Create Technical Issue (reported_time auto)
async function createTechnicalIssue(data) {
  const { reservation_id, description, status } = data;

  if (!reservation_id || !description) {
    throw new Error("reservation_id and description are required");
  }

  const request = new sql.Request();
  const result = await request
    .input("reservation_id", sql.Int, reservation_id)
    .input("description", sql.NVarChar, description)
    .input("status", sql.NVarChar, status || "Open")
    .query(`
      INSERT INTO TechnicalIssues (reservation_id, description, reported_time, status)
      OUTPUT inserted.*
      VALUES (@reservation_id, @description, GETDATE(), @status)
    `);

  const row = result.recordset[0];
  row.reported_time = formatDate(new Date(row.reported_time));
  return row;
}

// ✅ Get all issues
async function getAllTechnicalIssues() {
  const request = new sql.Request();
  const result = await request.query("SELECT * FROM TechnicalIssues ORDER BY issue_id ASC");
  return result.recordset.map(r => ({
    ...r,
    reported_time: formatDate(new Date(r.reported_time)),
  }));
}

// ✅ Get issue by ID
async function getTechnicalIssueById(issue_id) {
  const request = new sql.Request();
  const result = await request
    .input("issue_id", sql.Int, issue_id)
    .query("SELECT * FROM TechnicalIssues WHERE issue_id=@issue_id");

  const row = result.recordset[0];
  return row ? { ...row, reported_time: formatDate(new Date(row.reported_time)) } : null;
}

// ✅ Update issue (reported_time NOT updated here, stays as original)
async function updateTechnicalIssue(issue_id, data) {
  const { reservation_id, description, status } = data;

  const request = new sql.Request();
  await request
    .input("issue_id", sql.Int, issue_id)
    .input("reservation_id", sql.Int, reservation_id)
    .input("description", sql.NVarChar, description)
    .input("status", sql.NVarChar, status)
    .query(`
      UPDATE TechnicalIssues
      SET reservation_id=@reservation_id,
          description=@description,
          status=@status
      WHERE issue_id=@issue_id
    `);

  return getTechnicalIssueById(issue_id);
}

// ✅ Delete issue
async function deleteTechnicalIssue(issue_id) {
  const request = new sql.Request();
  await request
    .input("issue_id", sql.Int, issue_id)
    .query("DELETE FROM TechnicalIssues WHERE issue_id=@issue_id");
  return true;
}

module.exports = {
  createTechnicalIssue,
  getAllTechnicalIssues,
  getTechnicalIssueById,
  updateTechnicalIssue,
  deleteTechnicalIssue,
};
