const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) return res.status(400).json({ status: "error", message: "All fields are required!" })
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log('hashed password : ',hashedPassword)
    const exisitingUser = await User.find({ email })
    // console.log('existing user  : ',exisitingUser)
    if (exisitingUser.length) return res.status(409).json({ status: 'error', message: "user already exists" })
    // console.log('user details : ',req.body)
    const user = await User.create({ name, email, password: hashedPassword })
    return res.status(201).json({ status: "OK", message: "User created" })
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }

  //   res.tstaus(2)
  //   const user = await User.create({ name, email, password: hashedPassword, role });
  //   res.status(201).json({ status:"OK" });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ status: "error", message: "All fields are required!" })
    const user = await User.findOne({ email });
    // console.log('user  : ',user)
    if (!user) return res.status(404).json({ status: "error", message: "User not found!" })
    const comparePassword = await bcrypt.compare(password, user.password)
    if (comparePassword) {
      console.log('line no 40 : ', comparePassword)
      const token = generateToken(user._id)
      // console.log('token is : ',token)
      return res.status(200).cookie('token', token, {
        httpOnly: true,             // prevents JS access (XSS protection)
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        sameSite: 'Strict',         // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      }).json({ status: "OK", message: "Login Successful!" })
    } else {
      return res.status(401).json({ status: 'error', message: "Invalid credentials!" })
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }

};

exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetToken = resetToken;
  user.resetTokenExpire = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
  await sendEmail(user.email, 'Reset Password', `Reset here: ${resetURL}`);

  res.json({ message: 'Reset link sent to email' });
};

exports.resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpire: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.password = await bcrypt.hash(req.body.password, 10);
  user.resetToken = undefined;
  user.resetTokenExpire = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
};

exports.logout = async (req, res) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    })
    .status(200)
    .json({ status: 'OK', message: 'Logged out successfully' });
};

exports.createAccount = async (req, res) => {
  try {
    const { name, email, role, isActive, password } = req.body
    const exisitingUser = await User.find({ email })
    if (exisitingUser.length) return res.status(409).json({ status: 'error', message: "user already exists" })
    const user = await User.create({ name, email, role, isActive, password })
    return res.status(201).json({ status: "OK", message: "User created" })
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
}

exports.disableAccount = async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: false } },
      { new: true, select: 'name email isActive role' } // returns only specific fields
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User Deactivated!', status: "OK" });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.enableAccount = async(req,res)=>{
  try {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: true } },
      { new: true, select: 'name email isActive role' } // returns only specific fields
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User Activated!', status: "OK" });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.sendAccountDetails = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password -otp'); // exclude sensitive fields
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}