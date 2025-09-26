const { sql, pool, poolConnect } = require('../db');
const { generateToken } = require('../configuration/tokenGenerator');

class StaffModel {
    // Get all staff members
    async getAllStaff() {
        await poolConnect;
        try {
            const result = await pool.request().query('SELECT * FROM Staff ORDER BY created_at DESC');
            return result.recordset;
        } catch (error) {
            console.error('Error getting all staff:', error);
            throw error;
        }
    }

    // Get staff by ID
    async getStaffById(staffId) {
        await poolConnect;
        try {
            const result = await pool.request()
                .input('staff_id', sql.Int, staffId)
                .query('SELECT * FROM Staff WHERE staff_id = @staff_id');
            return result.recordset[0];
        } catch (error) {
            console.error('Error getting staff by ID:', error);
            throw error;
        }
    }

    // Create new staff member
    async createStaff({ username, email, role, access_scope }) {
        await poolConnect;
        try {
            // Check if username or email already exists
            const existingUser = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .query('SELECT * FROM Staff WHERE username = @username OR email = @email');

            if (existingUser.recordset.length > 0) {
                const error = new Error('Username or email already exists');
                error.status = 409; // Conflict
                throw error;
            }

            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .input('role', sql.NVarChar, role)
                .input('access_scope', sql.NVarChar, access_scope)
                .input('login_history', sql.NVarChar, JSON.stringify([]))
                .query(`
                    INSERT INTO Staff (username, email, role, access_scope, login_history)
                    OUTPUT INSERTED.*
                    VALUES (@username, @email, @role, @access_scope, @login_history)
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('Error creating staff:', error);
            throw error;
        }
    }

    // Update staff member
    async updateStaff(staffId, { username, email, role, access_scope, locked }) {
        await poolConnect;
        try {
            // Check if staff exists
            const existingStaff = await this.getStaffById(staffId);
            if (!existingStaff) {
                const error = new Error('Staff member not found');
                error.status = 404;
                throw error;
            }

            // Check for duplicate username or email
            const duplicateCheck = await pool.request()
                .input('staff_id', sql.Int, staffId)
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .query('SELECT * FROM Staff WHERE (username = @username OR email = @email) AND staff_id != @staff_id');

            if (duplicateCheck.recordset.length > 0) {
                const error = new Error('Username or email already in use by another staff member');
                error.status = 409; // Conflict
                throw error;
            }

            const result = await pool.request()
                .input('staff_id', sql.Int, staffId)
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .input('role', sql.NVarChar, role)
                .input('access_scope', sql.NVarChar, access_scope)
                .input('locked', sql.Bit, locked || false)
                .query(`
                    UPDATE Staff 
                    SET username = @username,
                        email = @email,
                        role = @role,
                        access_scope = @access_scope,
                        locked = @locked,
                        updated_at = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE staff_id = @staff_id
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('Error updating staff:', error);
            throw error;
        }
    }

    // Delete staff member
    async deleteStaff(staffId) {
        await poolConnect;
        try {
            const result = await pool.request()
                .input('staff_id', sql.Int, staffId)
                .query('DELETE FROM Staff WHERE staff_id = @staff_id');
            
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('Error deleting staff:', error);
            throw error;
        }
    }

    // Helper method to verify password
    async verifyPassword(plainPassword, storedPassword) {
        // First, check if the stored password is hashed (starts with $2b$)
        const isHashed = storedPassword && storedPassword.startsWith('$2b$');
        
        if (isHashed) {
            // If password is hashed, use bcrypt.compare
            const bcrypt = require('bcrypt');
            return await bcrypt.compare(plainPassword, storedPassword);
        }
        
        // If password is not hashed (plain text), do direct comparison
        return plainPassword === storedPassword;
    }

    // Admin login
    async adminLogin(username, password) {
        await poolConnect;
        try {
            // In a real application, you would verify the password hash here
            // For this example, we'll assume the password is stored as plain text (not recommended for production)
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .query('SELECT * FROM Staff WHERE username = @username');

            const staff = result.recordset[0];
            
            if (!staff) {
                const error = new Error('Invalid credentials');
                error.status = 401;
                throw error;
            }

            // Check if account is locked
            if (staff.locked) {
                const error = new Error('Account is locked. Please contact administrator.');
                error.status = 403;
                throw error;
            }

            // Verify password
            const isValidPassword = await this.verifyPassword(password, staff.password);

            // Update login history and failed attempts
            let loginHistory = [];
            try {
                loginHistory = JSON.parse(staff.login_history || '[]');
            } catch (e) {
                console.error('Error parsing login history:', e);
                loginHistory = [];
            }

            // Add current login to history (limit to last 10 logins)
            loginHistory.unshift(new Date().toISOString());
            loginHistory = loginHistory.slice(0, 10);

            if (!isValidPassword) {
                // Increment failed attempts and lock account if threshold is reached
                const failedAttempts = (staff.failed_attempts || 0) + 1;
                const locked = failedAttempts >= 5; // Lock after 5 failed attempts
                
                await pool.request()
                    .input('staff_id', sql.Int, staff.staff_id)
                    .input('failed_attempts', sql.Int, failedAttempts)
                    .input('locked', sql.Bit, locked)
                    .query(`
                        UPDATE Staff 
                        SET failed_attempts = @failed_attempts,
                            locked = @locked,
                            updated_at = GETDATE()
                        WHERE staff_id = @staff_id
                    `);

                const error = new Error(locked ? 'Account locked. Too many failed attempts.' : 'Invalid credentials');
                error.status = 401;
                error.remainingAttempts = 5 - failedAttempts;
                throw error;
            }

            // Reset failed attempts on successful login
            await pool.request()
                .input('staff_id', sql.Int, staff.staff_id)
                .input('login_history', sql.NVarChar, JSON.stringify(loginHistory))
                .query(`
                    UPDATE Staff 
                    SET failed_attempts = 0,
                        login_history = @login_history,
                        updated_at = GETDATE()
                    WHERE staff_id = @staff_id
                `);

            // Generate JWT token with user data
            const token = generateToken({
                staff_id: staff.staff_id,
                username: staff.username,
                email: staff.email,
                role: staff.role,
                access_scope: staff.access_scope
            });
            
            return {
                ...staff,
                token,
                login_history: loginHistory
            };
        } catch (error) {
            console.error('Error in admin login:', error);
            throw error;
        }
    }
}

module.exports = new StaffModel();
