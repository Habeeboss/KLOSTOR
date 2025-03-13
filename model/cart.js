// model/cart.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Orders',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }],
    totalPrice: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Virtual for dynamic price calculation
cartSchema.virtual('calculatedTotal').get(function() {
    return this.items.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
    }, 0);
});

module.exports = mongoose.model('Cart', cartSchema);