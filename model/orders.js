// model/orders.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    productCode: {
        type: String,
        required: [true, 'Product code is required'],
        unique: true
    },
    originalPrice: {
        type: Number,
        required: [true, 'Original price is required'],
        min: [0, 'Price must be a positive number']
    },
    discountPrice: {
        type: Number,
        min: [0, 'Discount price must be a positive number'],
        default: null
    },
    productBrand: {
        type: String,
        required: [true, 'Product brand is required'],
        trim: true
    },
    inStock: {
        type: Boolean,
        default: true
    },
    urlImage: {
        type: String,
        required: [true, 'Image URL is required']
    },
    media: [{
        type: String, // URLs to media files
        required: [true, 'Media URL is required']
    }],
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating must be at least 0'],
        max: [5, 'Rating cannot exceed 5']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    }
}, { timestamps: true });

orderSchema.index({ productName: 'text', productBrand: 'text' });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ price: 1 });

module.exports = mongoose.model('Orders', orderSchema);