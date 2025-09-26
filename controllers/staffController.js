const staffModel = require('../models/staffModel');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private/Admin
exports.getAllStaff = async (req, res) => {
    try {
        const staff = await staffModel.getAllStaff();
        res.status(200).json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        console.error('Error in getAllStaff:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Server error',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// @desc    Create a staff member
// @route   POST /api/staff
// @access  Private/Admin
exports.createStaff = async (req, res) => {
    try {
        const { username, email, role, access_scope } = req.body;

        // Basic validation
        if (!username || !email || !role || !access_scope) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email, role, and access_scope'
            });
        }

        const newStaff = await staffModel.createStaff({
            username,
            email,
            role,
            access_scope
        });

        res.status(201).json({
            success: true,
            data: newStaff
        });
    } catch (error) {
        console.error('Error in createStaff:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Server error',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// @desc    Update a staff member
// @route   PUT /api/staff/:id
// @access  Private/Admin
exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, access_scope, locked } = req.body;

        // Basic validation
        if (!username || !email || !role || !access_scope) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email, role, and access_scope'
            });
        }

        const updatedStaff = await staffModel.updateStaff(id, {
            username,
            email,
            role,
            access_scope,
            locked
        });

        if (!updatedStaff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedStaff
        });
    } catch (error) {
        console.error('Error in updateStaff:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Server error',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const isDeleted = await staffModel.deleteStaff(id);

        if (!isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Staff member deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteStaff:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Basic validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password'
            });
        }

        const staff = await staffModel.adminLogin(username, password);

        // Remove sensitive data before sending the response
        const { login_history, ...staffWithoutHistory } = staff;

        res.status(200).json({
            success: true,
            data: {
                ...staffWithoutHistory,
                login_history: login_history || []
            }
        });
    } catch (error) {
        console.error('Error in adminLogin:', error);
        const status = error.status || 500;
        const message = error.message || 'Server error';
        
        res.status(status).json({
            success: false,
            message: message,
            ...(error.remainingAttempts !== undefined && { remainingAttempts: error.remainingAttempts })
        });
    }
};

// @desc    Get staff profile
// @route   GET /api/staff/me
// @access  Private
exports.getMyProfile = async (req, res) => {
    try {
        // In a real app, you would get the staff ID from the JWT token
        // For this example, we'll use a query parameter
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Staff ID is required'
            });
        }

        const staff = await staffModel.getStaffById(id);
        
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        // Remove sensitive data before sending the response
        const { login_history, ...staffWithoutHistory } = staff;

        res.status(200).json({
            success: true,
            data: {
                ...staffWithoutHistory,
                login_history: login_history || []
            }
        });
    } catch (error) {
        console.error('Error in getMyProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};
