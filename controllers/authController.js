const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// const transporter = require("../config/mailer");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.signup = async (req, res) => {
  const { name, email, password, isActive } = req.body;
  try {
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ status: "error", message: "All fields are required!" });
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log('hashed password : ',hashedPassword)
    const exisitingUser = await User.find({ email });
    // console.log('existing user  : ',exisitingUser)
    if (exisitingUser.length)
      return res
        .status(409)
        .json({ status: "error", message: "user already exists" });
    // console.log('user details : ',req.body)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isActive,
    });
    return res.status(201).json({ status: "OK", message: "User created" });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }

  //   res.tstaus(2)
  //   const user = await User.create({ name, email, password: hashedPassword, role });
  //   res.status(201).json({ status:"OK" });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ status: "error", message: "All fields are required!" });
    const user = await User.findOne({ email });
    if (user?.isActive === false) {
      return res
        .status(404)
        .json({ status: "error", message: "User is deactivated!" });
    }
    console.log(user, "get user here ");
    // console.log('user  : ',user)
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "User not found!" });
    const comparePassword = await bcrypt.compare(password, user.password);
    if (comparePassword) {
      console.log("line no 40 : ", comparePassword);
      const token = generateToken(user._id);
      // console.log('token is : ',token)
      return res
        .status(200)
        .cookie("token", token, {
          httpOnly: true, // prevents JS access (XSS protection)
          secure: process.env.NODE_ENV === "production", // HTTPS in production
          sameSite: "Strict", // CSRF protection
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .json({
          status: "OK",
          message: "Login Successful!",
          userID: user._id,
          role: user.role,
        });
    } else {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials!" });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

// exports.forgotPassword = async (req, res) => {
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) return res.status(404).json({ message: 'User not found' });

//   const resetToken = crypto.randomBytes(20).toString('hex');
//   user.resetToken = resetToken;
//   user.resetTokenExpire = Date.now() + 3600000; // 1 hour
//   await user.save();

//   const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
//   await sendEmail(user.email, 'Reset Password', `Reset here: ${resetURL}`);

//   res.json({ message: 'Reset link sent to email' });
// };
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetToken = hashedOtp;
    user.resetTokenExpire = Date.now() + 3600000; // valid for 1 hour
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your OTP for Password Reset",
      text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 1 hour.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent to your email address" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    console.log(req.body, "request get ");

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpire: { $gt: Date.now() },
    });
    console.log(hashedToken, "hassss");
    if (!user)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    // Optional: Automatically login user by setting cookie
    // const token = createAuthToken(user); // if you use JWT
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'Strict',
    // });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.logout = async (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      sameSite: "Strict",
    })
    .status(200)
    .json({ status: "OK", message: "Logged out successfully" });
};

// exports.createAccount = async (req, res) => {
//   try {
//     const { name, email, role, isActive, password } = req.body
//     // const exisitingUser = await User.find({ email })
//     const existingUser = await User.findOne({ email });
// if (existingUser) {
//   return res.status(409).json({ status: 'error', message: "User already exists" });
// }
//     // console.log(exisitingUser,'exist')
//     // if (exisitingUser.length) return res.status(409).json({ status: 'error', message: "user already exists" })
//     const user = await User.create({ name, email, role, isActive, password })
//     return res.status(201).json({ status: "OK", message: "User created" })
//   } catch (error) {
//     return res.status(500).json({
//       status: 'error',
//       message: 'Something went wrong. Please try again later.',
//     });
//   }
// }
// const bcrypt = require('bcrypt');

exports.createAccount = async (req, res) => {
  try {
    const { name, email, role, isActive, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ status: "error", message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with hashed password
    const user = await User.create({
      name,
      email,
      role,
      isActive,
      password: hashedPassword,
    });

    return res.status(201).json({ status: "OK", message: "User created" });
  } catch (error) {
    console.error("Error in createAccount:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

exports.disableAccount = async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: false } },
      { new: true, select: "name email isActive role" } // returns only specific fields
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User Deactivated!", status: "OK" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.enableAccount = async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: true } },
      { new: true, select: "name email isActive role" } // returns only specific fields
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User Activated!", status: "OK" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// exports.sendAccountDetails = async (req, res) => {
//   try {
//     const users = await User.find({ role: { $ne: 'admin' } }).select('-password -otp'); // exclude sensitive fields
//     return res.status(200).json({ users });
//   } catch (error) {
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// }
exports.sendAccountDetails = async (req, res) => {
  try {
    // Fetch all users and exclude only sensitive fields
    const users = await User.find().select("-password -otp");
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

//delete api here
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    console.log(user, "uesr getting here ");

    return res
      .status(200)
      .json({ status: "OK", message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

//dashboard apis here

exports.userStatusCount = async (req, res) => {
  try {
    const activeCount = await User.countDocuments({ isActive: true });
    const inactiveCount = await User.countDocuments({ isActive: false });

    const stats = [
      { name: "Active Users", value: activeCount, color: "#52c41a" },
      { name: "Inactive Users", value: inactiveCount, color: "#ff4d4f" },
    ];

    return res.status(200).json({ status: "OK", data: stats });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};

exports.totalOfficers = async (req, res) => {
  try {
    const officerCount = await User.countDocuments({ role: "officer" });

    return res.status(200).json({
      status: "OK",
      totalOfficers: officerCount,
    });
  } catch (error) {
    console.error("Error counting officers:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

//user account update api
exports.getAccountDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password -otp");
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    return res.status(200).json({ status: "OK", user });
  } catch (error) {
    console.error("Error in getAccountDetails:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};


// PUT /api/account/:id

exports.editAccountDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, password } = req.body;

    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // Check if email is changing and already used
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({ status: "error", message: "Email already in use" });
      }
      user.email = email;
    }

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;

    // If password is provided, hash and update it
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.status(200).json({ status: "OK", message: "User updated successfully" });
  } catch (error) {
    console.error("Error in editAccountDetails:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};
