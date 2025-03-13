const express = require('express');
const { setAuthStatus, ensureActive } = require('../config/auth');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// Payment Route
router.post('/payment',ensureActive, async (req, res) => {
    const { amount, currency, source } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method: source,
            confirmation_method: 'manual',
            confirm: true,
        });
        res.json({ success: true, paymentIntent });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Render Payment Page
router.get('/payment', setAuthStatus,
    ensureActive, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart');
        }
        res.render('payment', { title: 'Payment', cart });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).send('Failed to fetch cart');
    }
});

module.exports = router;