const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const { isValidObjectId } = mongoose;

// Import Mongoose models
const { User, Account, UserAccount, Expense } = require('./models');

// Initialize Express app
const app = express();
app.use(express.json());
app.use(bodyParser.json());

// CORS configuration
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API routes

// Signup route
app.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send('User already exists');

        const newUser = new User({ email, password: hashedPassword, name });
        await newUser.save();

        const newAccount = new Account({ admin_id: newUser._id });
        await newAccount.save();

        const userAccount = new UserAccount({ user_id: newUser._id, account_id: newAccount._id, role: 'admin' });
        await userAccount.save();

        res.status(200).send('User and personal account created successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).send('User not found');

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).send('Invalid password');

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: 86400 });
        res.status(200).send({ auth: true, token });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get user details by ID
app.get('/users/:id', async (req, res) => {
    const userId = req.params.id;
    if (!isValidObjectId(userId)) return res.status(400).send('Invalid user ID');

    try {
        const user = await User.findById(userId).select('name');
        if (!user) return res.status(404).send('User not found');
        res.send(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Add expense route
app.post('/add-expense', async (req, res) => {
    const { name, amount, date, created_by, type, image_path, account_id } = req.body;

    if (!isValidObjectId(created_by) || !isValidObjectId(account_id)) {
        return res.status(400).send('Invalid account or user ID');
    }

    try {
        const newExpense = new Expense({ name, amount, date, created_by, type, image_path, account_id });
        await newExpense.save();
        res.status(200).send('Expense added successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error inserting expense into database');
    }
});

// Get accounts for a user by ID (admin accounts only)
app.get('/accounts/current/:userId', async (req, res) => {
    const userId = req.params.userId;
    if (!isValidObjectId(userId)) return res.status(400).send('Invalid user ID');

    try {
        const accounts = await Account.find({ admin_id: userId });
        res.status(200).json(accounts);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching account details');
    }
});

// Get all expenses for an account
app.get('/accounts/:accountId/expenses', async (req, res) => {
    const { accountId } = req.params;
    if (!isValidObjectId(accountId)) return res.status(400).send('Invalid account ID');

    try {
        const expenses = await Expense.find({ account_id: accountId });
        res.status(200).send(expenses);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching expenses');
    }
});

// Home route
app.get('/', (req, res) => {
    res.status(200).send("Backend is running");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
