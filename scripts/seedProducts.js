require('dotenv').config(); // must be at the top
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    name: 'Dell Latitude 5320 13.3"',
    price: 32499,
    originalPrice: 45999,
    image:
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/13-5320/media-gallery/notebook-latitude-13-5320-t-gallery-1.psd',
    condition: 'Refurbished - Excellent',
    category: 'laptops',
    brand: 'Dell',
    description:
      'Dell Latitude 5320 with Intel Core i5 11th Gen, 16GB RAM, 256GB SSD. Fully tested and professionally refurbished.',
    specs: [
      'Intel Core i5 11th Gen',
      '16GB DDR4 RAM',
      '256GB SSD',
      '13.3-inch Full HD Display',
      'Windows 11 Pro',
      'Backlit Keyboard'
    ],
    warranty: '2 Years Rekraft Warranty'
  },
  {
    name: 'Dell Latitude 7400 14"',
    price: 28999,
    originalPrice: 42999,
    image:
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-7400/media-gallery/notebook-latitude-14-7400-gallery-1.psd',
    condition: 'Refurbished - Excellent',
    category: 'laptops',
    brand: 'Dell',
    description:
      'Dell Latitude 7400 powered by Intel Core i7 processor with premium build quality.',
    specs: [
      'Intel Core i7 8th Gen',
      '8GB DDR4 RAM',
      '256GB SSD',
      '14-inch Full HD Display',
      'Windows 11 Pro'
    ],
    warranty: '2 Years Rekraft Warranty'
  },
  {
    name: 'Dell Latitude 5490 14"',
    price: 25499,
    originalPrice: 38999,
    image:
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-5490/media-gallery/notebook-latitude-14-5490-gallery-1.psd',
    condition: 'Refurbished - Very Good',
    category: 'laptops',
    brand: 'Dell',
    description:
      'Reliable Dell Latitude 5490 with Intel Core i5 processor, ideal for office and business use.',
    specs: [
      'Intel Core i5 8th Gen',
      '8GB RAM',
      '256GB SSD',
      '14-inch HD Display',
      'Windows 11 Pro'
    ],
    warranty: '1 Year Rekraft Warranty'
  },
  {
    name: 'Dell Latitude 5480 14"',
    price: 24999,
    originalPrice: 36999,
    image:
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-5480/media-gallery/notebook-latitude-14-5480-gallery-1.psd',
    condition: 'Refurbished - Very Good',
    category: 'laptops',
    brand: 'Dell',
    description:
      'Dell Latitude 5480 featuring Intel Core i7 processor with solid performance and durability.',
    specs: [
      'Intel Core i7 7th Gen',
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
