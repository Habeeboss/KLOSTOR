const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Orders = require('../model/orders');
const Admin = require('../model/adminReg');
const OrderRequest = require('../model/orderRequest');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {setAuthStatus, ensureRole, ensureActive } = require('../config/auth');



// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: './public/images1',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage }).single('urlImage');

router.post('/admin', setAuthStatus,
    ensureActive,
    ensureRole('admin'), upload, async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer Error:', err);
            return res.status(500).send('File upload failed');
        }

        try {
            const order = new Orders({
                productName: req.body.productName,
                productCode: req.body.productCode,
                originalPrice: req.body.originalPrice,
                discountPrice: req.body.discountPrice || null,
                productBrand: req.body.productBrand,
                inStock: req.body.inStock === 'true',
                urlImage: req.file ? `/images1/${req.file.filename}` : null,
                rating: req.body.rating || 0 // Include the rating
            });

            const savedOrder = await order.save();
            console.log('Order saved successfully:', savedOrder);
            res.redirect('/product');
        } catch (err) {
            console.error('Error saving order:', err);
            res.status(500).send('Failed to save order');
        }
    });
});


// GET Route - Retrieve Orders
router.get('/postdetails', setAuthStatus,
    ensureActive,
    ensureRole('admin'), async (req, res) => {
    try {
        const orders = await Orders.find({});
        res.render('order', { title: 'Post Details', orders });
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).send('Failed to fetch orders');
    }
});

// GET Route - Render Edit Page
router.get('/ordersEdit/:id', setAuthStatus,
    ensureActive,
    ensureRole('admin'), async (req, res) => {
    try {
        const order = await Orders.findById(req.params.id);
        if (!order) {
            return res.status(404).send('Order not found');
        }
        res.render('adminEdit', { order });
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).send('Error fetching order');
    }
});

// POST Route - Update Order
router.post('/ordersEdit/:id', setAuthStatus,
    ensureActive,
    ensureRole('admin'), upload,  async (req, res) => {
    try {
        const orderId = req.params.id;
        const { productName, productCode, originalPrice, discountPrice, productBrand, inStock, existingImage, rating } = req.body;

        let updatedData = {
            productName,
            productCode,
            originalPrice,
            discountPrice: discountPrice || null,
            productBrand,
            inStock: inStock === 'true',
            urlImage: req.file ? `/images1/${req.file.filename}` : existingImage,
            rating: rating || 0 // Ensure the rating is included
        };

        const order = await Orders.findById(orderId);
        if (order) {
            await Orders.findByIdAndUpdate(orderId, updatedData);
        }

        res.redirect('/product');
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).send("Failed to update order");
    }
});


router.post('/ordersDelete/:id', setAuthStatus,
    ensureActive,
    ensureRole('admin'), async (req, res) => {
    try {
        await Orders.findByIdAndDelete(req.params.id);
        res.redirect('/postdetails');
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).send('Failed to delete order');
    }
});


router.post('/admin/adminSignup', async (req, res) => {
    const { firstname, lastname, email, password, secretKey } = req.body;

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
        req.flash('error', 'Invalid secret key.');
        return res.redirect('/admin');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const existingAdmin = await Admin.findOne({ email }).session(session);
        if (existingAdmin) {
            req.flash('error', 'Email is already registered.');
            await session.abortTransaction();
            return res.redirect('/admin');
        }

        const newAdmin = new Admin({ 
            firstname,
            lastname,
            email,
            password, 
            role: 'admin',
            isActive: true
        });

        await newAdmin.save({ session });
        await session.commitTransaction();
        
        req.flash('success', 'Admin registration successful! Please log in.');
        res.redirect('/admin');
    } catch (err) {
        await session.abortTransaction();
        console.error('Admin registration error:', err);
        req.flash('error', err.message || 'Registration failed. Please try again.');
        res.redirect('/admin');
    } finally {
        session.endSession();
    }
});


router.post('/admin/adminLogin', (req, res, next) => {
    const { secretKey } = req.body;

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
        req.flash('error', 'Invalid secret key');
        return res.redirect('/admin');
    }

    passport.authenticate('admin', (err, admin, info) => {
        if (err) {
            console.error('Admin login error:', err);
            req.flash('error', 'Authentication server error');
            return res.redirect('/admin');
        }
        
        if (!admin) {
            const message = info?.message || 'Invalid credentials';
            req.flash('error', message);
            return res.redirect('/admin');
        }

        if (!admin.isActive) {
            req.flash('error', 'Admin account is deactivated');
            return res.redirect('/admin');
        }

        req.logIn(admin, (err) => {
            if (err) {
                req.flash('error', 'Session initialization failed');
                return res.redirect('/admin');
            }
            return res.redirect('/admin');
        });
    })(req, res, next);
});

module.exports = router;