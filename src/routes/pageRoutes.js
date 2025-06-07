const express = require('express');
const path = require('path');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /
 * @desc    Serve homepage
 * @access  Public
 */
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

/**
 * @route   GET /about
 * @desc    Serve about page
 * @access  Public
 */
router.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/about.html'));
});

/**
 * @route   GET /contact
 * @desc    Serve contact page
 * @access  Public
 */
router.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/contact.html'));
});

/**
 * @route   GET /products
 * @desc    Serve products page
 * @access  Public
 */
router.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/products.html'));
});

/**
 * @route   GET /products/:category
 * @desc    Serve category products page
 * @access  Public
 */
router.get('/products/:category', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/product-listing.html'));
});

/**
 * @route   GET /products/:category/:id
 * @desc    Serve product detail page
 * @access  Public
 */
router.get('/products/:category/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/product-detail.html'));
});

/**
 * @route   GET /solution
 * @desc    Serve solution page
 * @access  Public
 */
router.get('/solution', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/solution.html'));
});

/**
 * @route   GET /global-footprint
 * @desc    Serve global footprint page
 * @access  Public
 */
router.get('/global-footprint', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/global-footprint.html'));
});

/**
 * @route   GET /verify
 * @desc    Serve verify page
 * @access  Public
 */
router.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/verify.html'));
});

/**
 * @route   GET /admin/login
 * @desc    Serve admin login page
 * @access  Public
 */
router.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/login.html'));
});

/**
 * @route   GET /admin
 * @desc    Serve admin dashboard
 * @access  Private (Admin)
 */
router.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/dashboard.html'));
});

/**
 * @route   GET /admin/products
 * @desc    Serve admin products page
 * @access  Private (Admin)
 */
router.get('/admin/products', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/products.html'));
});

/**
 * @route   GET /admin/categories
 * @desc    Serve admin categories page
 * @access  Private (Admin)
 */
router.get('/admin/categories', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/categories.html'));
});

/**
 * @route   GET /admin/messages
 * @desc    Serve admin messages page
 * @access  Private (Admin)
 */
router.get('/admin/messages', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/messages.html'));
});

/**
 * @route   GET /admin/users
 * @desc    Serve admin users page
 * @access  Private (Admin)
 */
router.get('/admin/users', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/users.html'));
});

/**
 * @route   GET /admin/products/edit/:id
 * @desc    Serve admin product edit page
 * @access  Private (Admin)
 */
router.get('/admin/products/edit/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/product-edit.html'));
});

module.exports = router;

