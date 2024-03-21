const path = require('path');
const express = require('express');
const nocache = require("nocache")
const app = express();
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const session = require('express-session');
require('dotenv/config')

const port = 30000;
const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/PhoneX", {
  serverSelectionTimeoutMS: 5000,
});

app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

// Session configuration (consider alternatives)
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use(nocache())
// User view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));

// Mount routers
app.use('/', userRouter); // For user-facing routes (login, register, home)
app.use('/admin', adminRouter); // For user-facing routes (login, register, home)
//session manage
app.use(session({
  secret: 'secret', // Replace with a secret key for session
  resave: true,
  saveUninitialized: true
}));


app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));





