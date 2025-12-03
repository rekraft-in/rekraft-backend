const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  condition: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  description: { type: String },
  specs: [{ type: String }],
  warranty: { type: String },
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);