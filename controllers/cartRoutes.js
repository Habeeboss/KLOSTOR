const express = require('express');
const router = express.Router();
const Cart = require('../model/cart');
const Orders = require('../model/orders');
const {setAuthStatus, ensureRole, ensureActive } = require('../config/auth');

// Add to Cart
router.post('/add-to-cart', ensureActive, async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    try {
        const product = await Orders.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [], totalPrice: 0 });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += parseInt(quantity, 10);
        } else {
            cart.items.push({
                productId,
                quantity: parseInt(quantity, 10),
                price: product.discountPrice || product.originalPrice
            });
        }

        cart.totalPrice = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);
        await cart.save();
        res.redirect('/cart');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// View Cart
router.get('/cart', setAuthStatus,
    ensureActive, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
        res.render('cart', { title: 'Cart', cart, isAuthenticated: req.isAuthenticated() });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove Item from Cart
router.post('/remove-from-cart', ensureActive, async (req, res) => {
    const { productId } = req.body;
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        cart.totalPrice = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);
        await cart.save();
        res.redirect('/cart');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Quantity
router.post('/update-quantity', async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            cart.totalPrice = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);
            await cart.save();
        }
        res.redirect('/cart');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;