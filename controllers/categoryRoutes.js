const express = require('express');
const router = express.Router();
const Category = require('../model/category');
const {setAuthStatus, ensureRole, ensureActive } = require('../config/auth');

router.post('/create-category',  setAuthStatus,
    ensureActive,
    ensureRole('admin'), async (req, res) => {
    const { name } = req.body;
    try {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        const category = new Category({ name });
        await category.save();
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({ message: 'Failed to create category' });
    }
});

// Get all categories
router.get('/categories', setAuthStatus,
    async (req, res) => {
    try {
        const categories = await Category.find({});
        const isAuthenticated = req.isAuthenticated();
        res.json(categories); // Respond with JSON
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
});

module.exports = router;