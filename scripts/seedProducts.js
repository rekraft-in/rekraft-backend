const mongoose = require('mongoose');
require('dotenv').config();
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
  },
  {
    name: "Dell XPS 13",
    price: 57499,
    image: "https://m.media-amazon.com/images/I/71v2jVhGSZL._SL1500_.jpg",
    condition: "Like New",
    category: "dell", 
    brand: "Dell",
    description: "Dell XPS 13 laptop"
  },
  {
    name: "HP EliteBook 840 G6",
    price: 41999,
    image: "https://m.media-amazon.com/images/I/61oIuBFLq-L._SL1500_.jpg",
    condition: "Very Good",
    category: "hp",
    brand: "HP",
    description: "HP EliteBook 840 G6 business laptop"
  },
  {
    name: "MacBook Pro M2",
    price: 89999,
    image: "https://m.media-amazon.com/images/I/81jB6e+kY2L._SL1500_.jpg",
    condition: "Excellent",
    category: "apple",
    brand: "Apple",
    description: "MacBook Pro with M2 chip"
  },
  {
    name: "Lenovo ThinkPad X1 Carbon",
    price: 68999,
    image: "https://m.media-amazon.com/images/I/71L2V2eRfLL._SL1500_.jpg",
    condition: "Like New",
    category: "lenovo",
    brand: "Lenovo",
    description: "Lenovo ThinkPad X1 Carbon business laptop"
  },
  {
    name: "Acer Aspire 3",
    price: 8000,
    image: "https://m.media-amazon.com/images/I/71WtK6pUZaL._SL1500_.jpg",
    condition: "Good",
    category: "acer",
    brand: "Acer",
    description: "Acer Aspire 3 budget laptop for everyday use"
  },
  {
    name: "Dell Latitude E5450",
    price: 1000,
    image: "https://m.media-amazon.com/images/I/71Y1H9p7v+L._SL1500_.jpg",
    condition: "Fair",
    category: "dell",
    brand: "Dell",
    description: "Refurbished Dell Latitude E5450 basic laptop for essential computing"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log('✅ Products added to database!');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedDB();