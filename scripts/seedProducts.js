require('dotenv').config(); // must be at the top
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    name: "Dell Latitude 5320 13.3\"",
    price: 32499,
    images: [
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/13-5320/media-gallery/notebook-latitude-13-5320-t-gallery-1.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/13-5320/media-gallery/notebook-latitude-13-5320-t-gallery-2.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/13-5320/media-gallery/notebook-latitude-13-5320-t-gallery-3.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/13-5320/media-gallery/notebook-latitude-13-5320-t-gallery-4.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full"
    ],
    condition: "Refurbished - Excellent",
    category: "laptops",
    brand: "Dell",
    description: "Dell Latitude 5320 13.3\" (Intel i5 11th Gen, 16GB RAM, 256GB SSD). Includes 2-year warranty, tested battery, charger, and OS setup."
  },
  {
    name: "Dell Latitude 7400 14\"",
    price: 28999,
    images: [
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-7400/media-gallery/notebook-latitude-14-7400-gallery-1.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-7400/media-gallery/notebook-latitude-14-7400-gallery-2.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-7400/media-gallery/notebook-latitude-14-7400-gallery-3.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-7400/media-gallery/notebook-latitude-14-7400-gallery-4.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full"
    ],
    condition: "Refurbished - Excellent",
    category: "laptops",
    brand: "Dell",
    description: "Dell Latitude 7400 14\" (Intel i7, 8GB RAM, 256GB SSD). Includes 2-year warranty, tested battery, charger, and OS setup."
  },
  {
    name: "Dell Latitude 5490 14\"",
    price: 25499,
    images: [
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-5490/media-gallery/notebook-latitude-14-5490-gallery-1.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-5490/media-gallery/notebook-latitude-14-5490-gallery-2.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-5490/media-gallery/notebook-latitude-14-5490-gallery-3.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full"
    ],
    condition: "Refurbished - Very Good",
    category: "laptops",
    brand: "Dell",
    description: "Dell Latitude 5490 14\" (Intel i5, 8GB RAM, 256GB SSD). Includes 2-year warranty, tested battery, charger, and OS setup."
  },
  {
    name: "Dell Latitude 5480 14\"",
    price: 24999,
    images: [
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-5480/media-gallery/notebook-latitude-14-5480-gallery-1.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-5480/media-gallery/notebook-latitude-14-5480-gallery-2.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full",
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-5480/media-gallery/notebook-latitude-14-5480-gallery-3.psd?fmt=pjpg&pscan=auto&scl=1&hei=402&wid=536&qlt=100,1&resMode=sharp2&size=536,402&chrss=full"
    ],
    condition: "Refurbished - Very Good",
    category: "laptops",
    brand: "Dell",
    description: "Dell Latitude 5480 14\" (Intel i7, 8GB RAM, 256GB SSD). Includes 2-year warranty, tested battery, charger, and OS setup."
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
    console.log('✅ 4 Dell laptops added to database!');

    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedDB();