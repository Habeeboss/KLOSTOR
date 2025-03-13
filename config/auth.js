const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../model/userReg');
const Admin = require('../model/adminReg');

// Common authentication handler
const authenticate = (Model, roleType) => async (email, password, done) => {
    try {
        email = email.toLowerCase().trim();
        const user = await Model.findOne({ email })
            .select('+password +failedAttempts +lockUntil');

        if (!user || !user.isActive) {
            return done(null, false, { message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        return isMatch ? done(null, user) : done(null, false);
    } catch (err) {
        return done(err);
    }
};

// Strategies
passport.use('user', new LocalStrategy({ usernameField: 'email' }, authenticate(User, 'user')));
passport.use('admin', new LocalStrategy({ usernameField: 'email' }, authenticate(Admin, 'admin')));

passport.serializeUser((user, done) => {
    done(null, {
        id: user.id,
        type: user instanceof Admin ? 'admin' : 'user',
        role: user.role
    });
});

passport.deserializeUser(async (obj, done) => {
    try {
        const Model = obj.type === 'admin' ? Admin : User;
        const user = await Model.findById(obj.id);
        if (user && !user.role) {
            user.role = obj.type;
        }
        
        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = {
    setAuthStatus: (req, res, next) => {
        res.locals.isAuthenticated = req.isAuthenticated();
        res.locals.user = req.user;
        next();
    },

    ensureRole: (roles) => (req, res, next) => {
        if (!req.isAuthenticated() || !roles.includes(req.user.role)) {
            return req.xhr || req.headers.accept.includes('json')
                ? res.status(403).json({ error: 'Access denied' })
                : res.redirect('/login');
        }
        next();
    },

    ensureActive: (req, res, next) => {
        if (req.user && !req.user.isActive) {
            req.logout();
            return res.redirect('/login?error=account_inactive');
        }
        next();
    }
};