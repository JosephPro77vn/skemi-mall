const { User, Category, Product, ProductImage } = require('../models');

/**
 * Seed the database with initial data
 */
const seedDatabase = async () => {
  try {
    console.log('Seeding database...');
    
    // Create admin user if none exists
    const adminCount = await User.count();
    if (adminCount === 0) {
      console.log('Creating admin user...');
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123', // Will be hashed by the model hook
        is_admin: true
      });
    }
    
    // Create categories if none exist
    const categoryCount = await Category.count();
    if (categoryCount === 0) {
      console.log('Creating categories...');
      const categories = [
        {
          name: 'Digital Watch',
          slug: 'digital-watch',
          description: 'Modern digital watches with multiple functions'
        },
        {
          name: 'Quartz Watch',
          slug: 'quartz-watch',
          description: 'Classic quartz watches for everyday wear'
        },
        {
          name: 'Lady Watch',
          slug: 'lady-watch',
          description: 'Elegant watches designed for women'
        },
        {
          name: 'Mechanical Watch',
          slug: 'mechanical-watch',
          description: 'Traditional mechanical watches with intricate movements'
        },
        {
          name: 'Smart Watch',
          slug: 'smart-watch',
          description: 'Advanced smartwatches with connectivity features'
        },
        {
          name: 'Kids Watch',
          slug: 'kids-watch',
          description: 'Fun and durable watches for children'
        },
        {
          name: 'LED Watch',
          slug: 'led-watch',
          description: 'Modern LED watches with unique displays'
        },
        {
          name: 'Azan Watch',
          slug: 'azan-watch',
          description: 'Specialized watches with prayer time reminders'
        }
      ];
      
      await Category.bulkCreate(categories);
    }
    
    // Create sample products if none exist
    const productCount = await Product.count();
    if (productCount === 0) {
      console.log('Creating sample products...');
      
      // Get category IDs
      const categories = await Category.findAll();
      const categoryMap = {};
      categories.forEach(category => {
        categoryMap[category.slug] = category.id;
      });
      
      // Sample products
      const products = [
        {
          name: 'Digital Watch 1894',
          slug: 'digital-watch-1894',
          model_number: '1894',
          category_id: categoryMap['digital-watch'],
          description: 'The SKMEI 1894 Digital Watch combines modern technology with sleek design. This versatile timepiece features a clear digital display, comfortable strap, and multiple functions to meet your everyday needs.',
          features: 'Digital display with backlight\nWater resistant up to 30m\nChronograph functionality\nDate and day display\nAlarm function\nComfortable silicone strap\nLong battery life',
          specifications: JSON.stringify({
            'Case Material': 'ABS Plastic',
            'Band Material': 'Silicone',
            'Case Diameter': '42mm',
            'Band Width': '20mm',
            'Water Resistance': '30m',
            'Movement': 'Digital',
            'Battery': 'CR2025'
          })
        },
        {
          name: 'Quartz Watch 1961',
          slug: 'quartz-watch-1961',
          model_number: '1961',
          category_id: categoryMap['quartz-watch'],
          description: 'The SKMEI 1961 Quartz Watch offers timeless elegance with reliable performance. Featuring a classic design with modern touches, this watch is perfect for both casual and formal occasions.',
          features: 'Analog display with precise quartz movement\nStainless steel case\nWater resistant up to 30m\nDate display\nDurable mineral glass\nAdjustable stainless steel bracelet\nLong battery life',
          specifications: JSON.stringify({
            'Case Material': 'Stainless Steel',
            'Band Material': 'Stainless Steel',
            'Case Diameter': '40mm',
            'Band Width': '20mm',
            'Water Resistance': '30m',
            'Movement': 'Quartz',
            'Battery': 'SR626SW'
          })
        },
        {
          name: 'Lady Watch 9222',
          slug: 'lady-watch-9222',
          model_number: '9222',
          category_id: categoryMap['lady-watch'],
          description: 'The SKMEI 9222 Lady Watch combines elegance and functionality in a stylish package. Designed specifically for women, this watch features a slim profile, beautiful detailing, and reliable performance.',
          features: 'Elegant analog display\nSlim stainless steel case\nWater resistant up to 30m\nPrecise quartz movement\nScratch-resistant mineral glass\nAdjustable stainless steel bracelet\nLong battery life',
          specifications: JSON.stringify({
            'Case Material': 'Stainless Steel',
            'Band Material': 'Stainless Steel',
            'Case Diameter': '32mm',
            'Band Width': '16mm',
            'Water Resistance': '30m',
            'Movement': 'Quartz',
            'Battery': 'SR626SW'
          })
        }
      ];
      
      // Create products
      for (const productData of products) {
        const product = await Product.create(productData);
        
        // Create placeholder image for each product
        await ProductImage.create({
          product_id: product.id,
          image_url: '/images/placeholder.jpg',
          is_primary: true
        });
      }
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = { seedDatabase };

