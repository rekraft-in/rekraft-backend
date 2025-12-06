require('dotenv').config(); // must be at the top
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    name: "MacBook Air M1",
    price: 64999,
    image: "https://m.media-amazon.com/images/I/71TPda7cwUL._SL1500_.jpg",
    condition: "Excellent",
    category: "apple",
    brand: "Apple",
    description: "Apple MacBook Air with M1 chip"
  }
];

const seedDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log('✅ Products added to database!');

    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedDB();