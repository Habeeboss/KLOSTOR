const express = require('express');
const router = express.Router();
const OrderRequest = require('../model/orderRequest');
const multer = require('multer');
const path = require('path');
const {setAuthStatus, ensureRole, ensureActive } = require('../config/auth');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: './public/images1/',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage }).array('media', 10); // Allow up to 10 files

// POST Route - Add a New Order with Media
router.post('/admin', setAuthStatus,
  ensureActive,
  ensureRole('admin'), upload, async (req, res) => {
    try {
        const mediaFiles = req.files.map(file => `/uploads/${file.filename}`);
        const order = new Orders({
            productName: req.body.productName,
            productCode: req.body.productCode,
            originalPrice: req.body.originalPrice,
            discountPrice: req.body.discountPrice || null,
            productBrand: req.body.productBrand,
            inStock: req.body.inStock === 'true',
            urlImage: mediaFiles[0],
            media: mediaFiles,
            rating: req.body.rating || 0
        });

        const savedOrder = await order.save();
        res.redirect('/product');
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).send('Failed to save order');
    }
});

router.post('/orderRequest', async function (req, res) {
  try {
    const orderRequest = new OrderRequest({
      fullname: req.body.fullname,
      quantity: req.body.quantity,
      email: req.body.email,
      number: req.body.number,
      address: req.body.address,
    });

    const result = await orderRequest.save();
    console.log('Order saved successfully:', result);
    res.redirect('/');
  } catch (err) {
    console.error('Error saving order request:', err);
    res.status(500).send('Failed to process order request');
  }
});

module.exports = router;
