const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        unique: true, 
        required: true, 
        lowercase: true, 
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
    },
    password: { 
        type: String, 
        required: true,
        select: false,
        minlength: 8,
        validate: {
            validator: function(v) {
                return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(v);
            },
            message: 'Password must contain uppercase, lowercase, and number'
        }
    },
    role: { 
        type: String, 
        enum: ['customer'], 
        default: 'customer' 
    },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    cart: { type: Schema.Types.ObjectId, ref: 'Cart' },
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(new Error('Password hashing failed: ' + err.message));
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    if (this.lockUntil && Date.now() < this.lockUntil) {
        throw new Error('Account locked until ' + this.lockUntil);
    }
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    if (!isMatch) {
        this.failedAttempts += 1;
        if (this.failedAttempts >= 5) {
            this.lockUntil = Date.now() + 15 * 60 * 1000;
        }
        await this.save();
    }
    return isMatch;
};

userSchema.virtual('fullName').get(function() {
    return `${this.firstname} ${this.lastname}`;
});

module.exports = mongoose.model('User', userSchema);