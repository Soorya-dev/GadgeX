require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const path = require('path');
const nocache = require('nocache');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const mongoose = require('mongoose');
const morgan = require('morgan');
const { configurePayPal } = require('./config/paypalConfig');

const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
// Connect to MongoDB
mongoose.connect(process.env.Mongo_Host)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));


// Middleware setup
// app.use(morgan('dev'));
app.use(nocache());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));
app.use(flash());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mount routers
app.use('/', userRouter); // For user-facing routes (login, register, home)
app.use('/admin', adminRouter); // For admin-facing routes

// Page not found error
app.use((req, res, next) => {
  res.status(404).render('./user/404');
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

// Configure PayPal
configurePayPal();