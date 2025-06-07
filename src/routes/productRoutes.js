const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { auth, admin } = require('../middleware/auth');
const { Product, Category, ProductImage } = require('../models');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/products');
    
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
    cb(null, 'product-' + uniqueSuffix + ext);
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
 * @route   GET /api/products
 * @desc    Get all products with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query options
    const queryOptions = {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_primary']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']] // Default sorting
    };
    
    // Add category filter if provided
    if (category) {
      queryOptions.include[0].where = { slug: category };
    }
    
    // Add search filter if provided
    if (search) {
      queryOptions.where = {
        ...queryOptions.where,
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { model_number: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Add sorting if provided
    if (sort) {
      switch (sort) {
        case 'name-asc':
          queryOptions.order = [['name', 'ASC']];
          break;
        case 'name-desc':
          queryOptions.order = [['name', 'DESC']];
          break;
        case 'oldest':
          queryOptions.order = [['createdAt', 'ASC']];
          break;
        // Default is newest first (already set)
      }
    }
    
    // Get products with count
    const { count, rows: products } = await Product.findAndCountAll(queryOptions);
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      success: true,
      products,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_primary']
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Admin)
 */
router.post(
  '/',
  [auth, admin, upload.array('images', 10)],
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('model_number').notEmpty().withMessage('Model number is required'),
    body('category_id').notEmpty().withMessage('Category is required'),
    body('description').notEmpty().withMessage('Description is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    try {
      // Check if category exists
      const category = await Category.findByPk(req.body.category_id);
      if (!category) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
      
      // Create product
      const product = await Product.create({
        name: req.body.name,
        model_number: req.body.model_number,
        category_id: req.body.category_id,
        description: req.body.description,
        features: req.body.features || null,
        specifications: req.body.specifications ? JSON.parse(req.body.specifications) : null,
        price: req.body.price || null
      });
      
      // Process uploaded images
      if (req.files && req.files.length > 0) {
        const productImages = req.files.map((file, index) => ({
          product_id: product.id,
          image_url: `/uploads/products/${file.filename}`,
          is_primary: index === 0 // First image is primary
        }));
        
        await ProductImage.bulkCreate(productImages);
      }
      
      // Get the created product with relations
      const createdProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: ProductImage,
            as: 'images',
            attributes: ['id', 'image_url', 'is_primary']
          }
        ]
      });
      
      res.status(201).json({ success: true, product: createdProduct });
    } catch (err) {
      console.error('Create product error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  [auth, admin, upload.array('images', 10)],
  async (req, res) => {
    try {
      // Check if product exists
      let product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      
      // Check if category exists if provided
      if (req.body.category_id) {
        const category = await Category.findByPk(req.body.category_id);
        if (!category) {
          return res.status(400).json({ success: false, message: 'Invalid category' });
        }
      }
      
      // Update product
      await product.update({
        name: req.body.name || product.name,
        model_number: req.body.model_number || product.model_number,
        category_id: req.body.category_id || product.category_id,
        description: req.body.description || product.description,
        features: req.body.features || product.features,
        specifications: req.body.specifications ? JSON.parse(req.body.specifications) : product.specifications,
        price: req.body.price || product.price
      });
      
      // Process uploaded images if any
      if (req.files && req.files.length > 0) {
        // If replace_images flag is set, delete existing images
        if (req.body.replace_images === 'true') {
          // Get existing images
          const existingImages = await ProductImage.findAll({
            where: { product_id: product.id }
          });
          
          // Delete image files
          for (const image of existingImages) {
            const imagePath = path.join(__dirname, '../../public', image.image_url);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          }
          
          // Delete image records
          await ProductImage.destroy({
            where: { product_id: product.id }
          });
        }
        
        // Add new images
        const productImages = req.files.map((file, index) => ({
          product_id: product.id,
          image_url: `/uploads/products/${file.filename}`,
          is_primary: index === 0 && req.body.replace_images === 'true' // First image is primary if replacing
        }));
        
        await ProductImage.bulkCreate(productImages);
      }
      
      // Get the updated product with relations
      const updatedProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: ProductImage,
            as: 'images',
            attributes: ['id', 'image_url', 'is_primary']
          }
        ]
      });
      
      res.json({ success: true, product: updatedProduct });
    } catch (err) {
      console.error('Update product error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private (Admin)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    // Check if product exists
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Get product images
    const images = await ProductImage.findAll({
      where: { product_id: product.id }
    });
    
    // Delete image files
    for (const image of images) {
      const imagePath = path.join(__dirname, '../../public', image.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete product (cascade will delete images)
    await product.destroy();
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

