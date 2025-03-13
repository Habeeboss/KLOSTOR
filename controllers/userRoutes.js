const express = require('express');
const router = express.Router();
const User = require('../model/userReg');
const Cart = require('../model/cart');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

router.post('/customerProduct/customerSignup', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { firstname, lastname, email, password } = req.body;

        const existingUser = await User.findOne({ email }).session(session);
        if (existingUser) {
            req.flash('error', 'Email is already registered.');
            await session.abortTransaction();
            return res.redirect('/customerProduct');
        }

        const newUser = new User({
            firstname,
            lastname,
            email,
            password,
            role: 'customer'
        });

        const savedUser = await newUser.save({ session });
        
        // Create cart in transaction
        const cart = new Cart({
            userId: savedUser._id,
            items: [],
            totalPrice: 0
        });
        await cart.save({ session });

        await session.commitTransaction();
        
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/customerProduct');
    } catch (err) {
        await session.abortTransaction();
        console.error('Registration error:', err);
        req.flash('error', err.message || 'Registration failed. Please try again.');
        res.redirect('/customerProduct');
    } finally {
        session.endSession();
    }
});

router.post('/customerProduct/customerLogin', (req, res, next) => {
    passport.authenticate('user', (err, user, info) => {
        if (err) {
            console.error('Login error:', err);
            req.flash('error', 'Authentication server error');
            return res.redirect('/customerProduct');
        }
        
        if (!user) {
            const message = info?.message || 'Invalid credentials';
            req.flash('error', message);
            return res.redirect('/customerProduct');
        }

        if (!user.isActive) {
            req.flash('error', 'Account is deactivated');
            return res.redirect('/customerProduct');
        }

        req.logIn(user, (err) => {
            if (err) {
                req.flash('error', 'Session initialization failed');
                return res.redirect('/customerProduct');
            }
            return res.redirect('/customerProduct');
        });
    })(req, res, next);
});

module.exports = router;