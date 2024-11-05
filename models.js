const mongoose = require('mongoose');

// User schema
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
});

// Account schema
const accountSchema = new mongoose.Schema({
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// UserAccount schema for associating users and accounts with roles
const userAccountSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    role: { type: String, required: true },
});

// Expense schema with pre-save hook to check ObjectId validity
const expenseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now, required: true }, // Added default date
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    image_path: { type: String },
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
});

// Pre-save hook for validating account_id and created_by ObjectIds in Expense
expenseSchema.pre('save', function (next) {
    if (!mongoose.Types.ObjectId.isValid(this.account_id) || !mongoose.Types.ObjectId.isValid(this.created_by)) {
        const err = new Error('Invalid ObjectId for account_id or created_by');
        return next(err);
    }
    next();
});

// Models
const User = mongoose.model('User', userSchema);
const Account = mongoose.model('Account', accountSchema);
const UserAccount = mongoose.model('UserAccount', userAccountSchema);
const Expense = mongoose.model('Expense', expenseSchema);

module.exports = { User, Account, UserAccount, Expense };
