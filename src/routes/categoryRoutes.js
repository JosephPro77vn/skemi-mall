const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, admin } = require('../middleware/auth');
const { Category, Product } = require('../models');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/categories');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'category-' + uniqueSuffix + ext);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json({ success: true, categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    res.json({ success: true, category });
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/categories/:slug/products
 * @desc    Get products by category slug
 * @access  Public
 */
router.get('/:slug/products', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Find category by slug
    const category = await Category.findOne({
      where: { slug: req.params.slug }
    });
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Get products with count
    const { count, rows: products } = await Product.findAndCountAll({
      where: { category_id: category.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      success: true,
      category,
      products,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (err) {
    console.error('Get category products error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private (Admin)
 */
router.post(
  '/',
  [auth, admin, upload.single('image')],
  [
    body('name').notEmpty().withMessage('Category name is required'),
    body('slug').notEmpty().withMessage('Category slug is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    try {
      // Check if category with same slug exists
      const existingCategory = await Category.findOne({
        where: { slug: req.body.slug }
      });
      
      if (existingCategory) {
        return res.status(400).json({ success: false, message: 'Category with this slug already exists' });
      }
      
      // Create category
      const category = await Category.create({
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description || null,
        image_url: req.file ? `/uploads/categories/${req.file.filename}` : null
      });
      
      res.status(201).json({ success: true, category });
    } catch (err) {
      console.error('Create category error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  [auth, admin, upload.single('image')],
  async (req, res) => {
    try {
      // Check if category exists
      let category = await Category.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      
      // Check if slug is being changed and if it already exists
      if (req.body.slug && req.body.slug !== category.slug) {
        const existingCategory = await Category.findOne({
          where: { slug: req.body.slug }
        });
        
        if (existingCategory) {
          return res.status(400).json({ success: false, message: 'Category with this slug already exists' });
        }
      }
      
      // If new image is uploaded, delete old image
      if (req.file && category.image_url) {
        const oldImagePath = path.join(__dirname, '../../public', category.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Update category
      await category.update({
        name: req.body.name || category.name,
        slug: req.body.slug || category.slug,
        description: req.body.description !== undefined ? req.body.description : category.description,
        image_url: req.file ? `/uploads/categories/${req.file.filename}` : category.image_url
      });
      
      res.json({ success: true, category });
    } catch (err) {
      console.error('Update category error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Private (Admin)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    // Check if category exists
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Check if category has products
    const productCount = await Product.count({
      where: { category_id: category.id }
    });
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products. Please move or delete the products first.`
      });
    }
    
    // Delete category image if exists
    if (category.image_url) {
      const imagePath = path.join(__dirname, '../../public', category.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete category
    await category.destroy();
    
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

