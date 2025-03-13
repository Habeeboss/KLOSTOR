// model/orderRequest.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderRequestSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullname: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    quantity: {
        type: String,
        required: [true, 'Quantity is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    number: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        validate: {
            validator: function(value) {
                return /^(?:\+234\d{10}|\d{11})$/.test(value);
            },
            message: props => `${props.value} is not a valid Nigerian or international phone number!`
        }
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
    },
    viewed: { type: Boolean, default: false }
}, {
    timestamps: true,
});

module.exports = mongoose.model('OrderRequest', orderRequestSchema);