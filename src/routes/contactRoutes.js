const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, admin } = require('../middleware/auth');
const { ContactMessage } = require('../models');

const router = express.Router();

/**
 * @route   POST /api/contact
 * @desc    Submit a contact message
 * @access  Public
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    try {
      // Create contact message
      const contactMessage = await ContactMessage.create({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || null,
        subject: req.body.subject,
        message: req.body.message,
        status: 'unread'
      });
      
      res.status(201).json({
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon.'
      });
    } catch (err) {
      console.error('Contact message error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * @route   GET /api/contact/messages
 * @desc    Get all contact messages
 * @access  Private (Admin)
 */
router.get('/messages', [auth, admin], async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query options
    const queryOptions = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    };
    
    // Add status filter if provided
    if (status) {
      queryOptions.where = { status };
    }
    
    // Get messages with count
    const { count, rows: messages } = await ContactMessage.findAndCountAll(queryOptions);
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      success: true,
      messages,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/contact/messages/:id
 * @desc    Get contact message by ID
 * @access  Private (Admin)
 */
router.get('/messages/:id', [auth, admin], async (req, res) => {
  try {
    const message = await ContactMessage.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    // Mark message as read if it's unread
    if (message.status === 'unread') {
      await message.update({ status: 'read' });
    }
    
    res.json({ success: true, message });
  } catch (err) {
    console.error('Get message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/contact/messages/:id
 * @desc    Update contact message status
 * @access  Private (Admin)
 */
router.put('/messages/:id', [auth, admin], async (req, res) => {
  try {
    const message = await ContactMessage.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    // Update message status
    await message.update({
      status: req.body.status || message.status
    });
    
    res.json({ success: true, message });
  } catch (err) {
    console.error('Update message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/contact/messages/:id
 * @desc    Delete a contact message
 * @access  Private (Admin)
 */
router.delete('/messages/:id', [auth, admin], async (req, res) => {
  try {
    const message = await ContactMessage.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    // Delete message
    await message.destroy();
    
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

