require('dotenv').config(); // must be at the top
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    name: 'Dell Latitude 5320 13-inch (i5 11th Gen, 16GB, 256GB)',
    price: 32499,
    originalPrice: 45999,
    image:
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/13-5320/media-gallery/notebook-latitude-13-5320-t-gallery-1.psd',
    category: 'laptops',
    brand: 'Dell',
    description:
      'Dell Latitude 5320 13-inch laptop with Intel Core i5 11th Gen, 16GB RAM and 256GB SSD. Ideal for business and professional use.',
    specs: [
      'Intel Core i5 11th Gen',
      '16GB DDR4 RAM',
      '256GB SSD',
      '13-inch Full HD Display',
      'Windows 11 Pro'
    ],
    warranty: '2 Years Rekraft Warranty'
  },
  {
    name: 'Dell Latitude 7400 14-inch (i7, 8GB, 256GB)',
    price: 28999,
    originalPrice: 42999,
    image:
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-7400/media-gallery/notebook-latitude-14-7400-gallery-1.psd',
    category: 'laptops',
    brand: 'Dell',
    description:
      'Dell Latitude 7400 14-inch laptop powered by Intel Core i7 processor with premium design and performance.',
    specs: [
      'Intel Core i7 Processor',
      '8GB DDR4 RAM',
      '256GB SSD',
      '14-inch Full HD Display',
      'Windows 11 Pro'
    ],
    warranty: '2 Years Rekraft Warranty'
  },
  {
    name: 'Dell Latitude 5490 14-inch (i5, 8GB, 256GB)',
    price: 25499,
    originalPrice: 38999,
    image:
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-5490/media-gallery/notebook-latitude-14-5490-gallery-1.psd',
    category: 'laptops',
    brand: 'Dell',
    description:
      'Dell Latitude 5490 with Intel Core i5 processor, suitable for office, students and everyday business tasks.',
    specs: [
      'Intel Core i5 Processor',
      '8GB RAM',
      '256GB SSD',
      '14-inch Display',
      'Windows 11 Pro'
    ],
    warranty: '1 Year Rekraft Warranty'
  },
  {
    name: 'Dell Latitude 5480 14-inch (i7, 8GB, 256GB)',
    price: 24999,
    originalPrice: 36999,
    image:
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-5480/media-gallery/notebook-latitude-14-5480-gallery-1.psd',
    category: 'laptops',
    brand: 'Dell',
    description:
      'Dell Latitude 5480 with Intel Core i7 processor offering solid performance and durability.',
    specs: [
      'Intel Core i7 Processor',
      '8GB RAM',
      '256GB SSD',
      '14-inch Full HD Display',
      'Windows 11 Pro'
    ],
    warranty: '1 Year Rekraft Warranty'
  }
];

const seedDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI not found in .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Product.deleteMany({});
    console.log('🗑️ Existing products removed');

    await Product.insertMany(products);
    console.log(`✅ ${products.length} products inserted successfully`);

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDB();
