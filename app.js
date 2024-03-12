const path=require('path')
const express = require('express');

const app=express()
const userRouter=require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const session=require('express-session')

const port=3000
const mongoose=require('mongoose')
mongoose.connect("mongodb://localhost:27017/PhoneX", {
  serverSelectionTimeoutMS: 5000,
});
app.use(express.urlencoded({extended:true}));
app.use(express.json());

//for user view engine
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/views'));
app.use(express.static(path.join(__dirname,'public')))
app.use(session({ secret: 'your_secret_key' })); // Session configuration (consider alternatives)


app.use('/',userRouter);
app.use('/admin', adminRouter); // Mount admin router on /admin path


// Route to request OTP (e.g., POST /api/request-otp)
app.post('/api/request-otp', async (req, res) => {
  const { email } = req.body;

  // Validate email address

  const otp = generateOTP();

  // Send OTP email
  await sendOTPEmail(email, otp);

  // Store OTP in database or session (optional for verification)
  // ...

  res.send('OTP sent to your email');
});

// Route to verify OTP (e.g., POST /api/verify-otp)
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  // Retrieve stored OTP from database or session (optional)
  // const storedOTP = ...;

  // Validate OTP (replace with your verification logic)
  if (otp === '123456') { // Replace with actual verification logic
    res.send('OTP verified successfully');
  } else {
    res.status(401).send('Invalid OTP');
  }
});





































app.listen(port,()=>{
    console.log(`Server started at http://localhost:${port}`);
})