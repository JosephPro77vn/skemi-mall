const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, admin } = require('../middleware/auth');
const { User } = require('../models');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/', [auth, admin], async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin)
 */
router.get('/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Admin)
 */
router.post(
  '/',
  [auth, admin],
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('is_admin').isBoolean().withMessage('is_admin must be a boolean')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { username, email, password, is_admin } = req.body;
    
    try {
      // Check if user already exists
      let user = await User.findOne({ where: { username } });
      if (user) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
      
      user = await User.findOne({ where: { email } });
      if (user) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      
      // Create new user
      user = await User.create({
        username,
        email,
        password, // Will be hashed by the model hook
        is_admin
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user.toJSON();
      
      res.status(201).json({ success: true, user: userWithoutPassword });
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  [auth, admin],
  async (req, res) => {
    try {
      // Check if user exists
      let user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Check if username is being changed and if it already exists
      if (req.body.username && req.body.username !== user.username) {
        const existingUser = await User.findOne({
          where: { username: req.body.username }
        });
        
        if (existingUser) {
          return res.status(400).json({ success: false, message: 'Username already exists' });
        }
      }
      
      // Check if email is being changed and if it already exists
      if (req.body.email && req.body.email !== user.email) {
        const existingUser = await User.findOne({
          where: { email: req.body.email }
        });
        
        if (existingUser) {
          return res.status(400).json({ success: false, message: 'Email already exists' });
        }
      }
      
      // Update user
      const updateData = {
        username: req.body.username || user.username,
        email: req.body.email || user.email,
        is_admin: req.body.is_admin !== undefined ? req.body.is_admin : user.is_admin
      };
      
      // Only update password if provided
      if (req.body.password) {
        updateData.password = req.body.password; // Will be hashed by the model hook
      }
      
      await user.update(updateData);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user.toJSON();
      
      res.json({ success: true, user: userWithoutPassword });
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private (Admin)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent deleting the last admin user
    if (user.is_admin) {
      const adminCount = await User.count({
        where: { is_admin: true }
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }
    
    // Delete user
    await user.destroy();
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/users/:id/change-password
 * @desc    Change user password
 * @access  Private (Admin or Self)
 */
router.put(
  '/:id/change-password',
  [auth],
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    try {
      // Check if user exists
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Check if user is authorized (admin or self)
      if (req.user.id !== user.id && !req.user.is_admin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to change this user\'s password'
        });
      }
      
      // Verify current password
      const isMatch = await user.comparePassword(req.body.current_password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      
      // Update password
      await user.update({
        password: req.body.new_password // Will be hashed by the model hook
      });
      
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router;

