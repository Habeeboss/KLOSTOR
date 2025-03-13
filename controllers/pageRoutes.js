const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Orders = require('../model/orders');
const OrderRequest = require('../model/orderRequest');
const Admin = require('../model/adminReg');
const {setAuthStatus, ensureRole, ensureActive } = require('../config/auth');

router.get('/', async (req, res) => {
    try {
        // Fetch the most recent 3 products
        const newArrivals = await Orders.find({})
            .sort({ createdAt: -1 })
            .limit(3)
            .exec();

        // Pass the data as `orders` and include the isAuthenticated status
        res.render('index', { 
            title: 'Home Page', 
            orders: newArrivals,
            isAuthenticated: req.isAuthenticated(),
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            }
        });
    } catch (err) {
        console.error('Error fetching new arrivals:', err);
        res.status(500).send('Failed to fetch new arrivals');
    }
});

router.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

router.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us' });
});

router.get('/submit', (req, res) => {
    res.render('submit', { title: 'Submit', error: req.flash('error') });
});

router.get('/admin', setAuthStatus, 
    ensureActive, 
    ensureRole('admin'), async (req, res) => {
    try {
        const newOrdersCount = await OrderRequest.countDocuments({ viewed: false });
        res.render('admin', { 
            title: 'Admin', 
            newOrdersCount,
            admin: req.user ? req.user.isAdmin : false,
            isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        });
    } catch (err) {
        console.error('Error fetching new orders count:', err);
        res.status(500).send('Failed to fetch new orders count');
    }
});

// Route to fetch and mark orders as viewed
router.get('/order',  async (req, res) => {
    try {
        const orderRequests = await OrderRequest.find({}).sort({ _id: -1 }).exec();
        await OrderRequest.updateMany({ viewed: false }, { $set: { viewed: true } });
        res.render('order', { 
            title: 'Order Requests', 
            orderrequests: orderRequests, 
            isAuthenticated: req.isAuthenticated() });
    } catch (err) {
        console.error('Error fetching order requests:', err);
        res.status(500).send('Failed to fetch order requests');
    }
});

router.get('/product', setAuthStatus, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    try {
        const orders = await Orders.find({})
        .sort({ createdAt: -1 })
        .exec()
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();;
        const count = await Orders.countDocuments();
        const isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
        res.render('product', { 
            title: 'Product Page', 
            orders, 
            isAuthenticated,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Failed to fetch products');
    }
});

// Route to render the preview page
router.get('/preview/:id', setAuthStatus, async (req, res) => {
    try {
        const product = await Orders.findById(req.params.id);

        // If the product doesn't exist, return a 404 error
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('preview', { 
            title: 'Product Preview', 
            product,
            isAuthenticated: req.isAuthenticated()
        });
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).send('Failed to fetch product');
    }
});

// Create a new order (POST endpoint)
router.post('/orders', async (req, res) => {
    try {
        const { productName, productCode, price, productBrand, urlImage } = req.body;

        const order = new Orders({
            productName,
            productCode,
            price,
            productBrand,
            urlImage,
        });

        await order.save();
        res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({ message: 'Error creating order', error: error.message });
    }
});

// Create a new order request (POST endpoint)
router.post('/order', async (req, res) => {
    try {
        const { fullname, quantity, email, number, address } = req.body;

        const order = new OrderRequest({
            fullname,
            quantity,
            email,
            number,
            address,
        });

        await order.save();
        res.status(201).json({ message: 'Order request created successfully', order });
    } catch (error) {
        console.error('Error creating order request:', error);
        res.status(400).json({ message: 'Error creating order request', error: error.message });
    }
});


router.get('/search', async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.json([]);

        // Perform case-insensitive search on product name and brand
        const orders = await Orders.find({
            $or: [
                { productName: { $regex: query, $options: "i" } },
                { productBrand: { $regex: query, $options: "i" } }
            ]
        });

        res.json(orders);
    } catch (err) {
        console.error("Error fetching search results:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/customerProduct', setAuthStatus,
    ensureActive,
   async (req, res) => {
    try {
        const orders = await Orders.find({})
        .sort({ createdAt: -1 }).exec();
        const count = await Orders.countDocuments();
        res.render('customerProduct', { 
            title: 'Customer Product Page', 
            orders, 
            user: req.user, 
            isAuthenticated: req.isAuthenticated() 
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Failed to fetch products');
    }
});

module.exports = router;
