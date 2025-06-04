
// user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   visaType: { type: String, enum: ['work', 'study'] },
//   photo: { type: String },
//   aadhar: { type: String },
//   passport: { type: String },
//   father: { type: String },
//   address: { type: String },
//   city: { type: String },
//   state: { type: String },
//   status: { type: String, enum: ['pending', 'under review', 'approved', 'rejected'], default: 'pending' },
//   notes: String,

const { transporter } = require("../config/mailer")
const Application = require("../models/Application")
const User = require("../models/User")

// exports.submitApp = async (req, res) => {
//     try {
//         const { father, address, city, state, visaType } = req.body
//         const photo = req.files['photo']?.[0]?.filename
//         const aadhar = req.files['aadhar']?.[0]?.filename
//         const passport = req.files['passport']?.[0]?.filename
//         const userId = req.id.id;

//         const newApplication = new Application({
//             user: userId,
//             visaType,
//             father,
//             address,
//             city,
//             state,
//             photo: photo || '',
//             aadhar: aadhar || '',
//             passport: passport || ''
//         })
//         await newApplication.save()
//         return res.status(201).json({ status: "OK", message: "Application Submitted successfully!" })
//     } catch (error) {
//         console.log(error,'get error here ')
//         res.status(500).json({ error: 'Server error' });
//     }
// }


exports.submitApp = async (req, res) => {
  try {
    const { father, address, city, state, visaType } = req.body;
    const photo = req.files['photo']?.[0]?.filename;
    const aadhar = req.files['aadhar']?.[0]?.filename;
    const passport = req.files['passport']?.[0]?.filename;
    const userId = req.id.id;

    // Check if user has already submitted an application
    const existingApp = await Application.findOne({ user: userId });
    if (existingApp) {
        
      return res.status(402).json({ status: 'error', message: 'You have already submitted an application.' });
    }

    const newApplication = new Application({
      user: userId,
      visaType,
      father,
      address,
      city,
      state,
      photo: photo || '',
      aadhar: aadhar || '',
      passport: passport || ''
    });

    await newApplication.save();

    return res.status(201).json({ status: 'OK', message: 'Application Submitted successfully!' });
  } catch (error) {
    console.log(error, 'get error here ');
    res.status(500).json({ error: 'Server error' });
  }
};



exports.applications = async (req, res) => {
    try {
      const applications = await Application.find()
      .populate({
        path: 'user',
        select: '-password -otp' // exclude sensitive user fields
      });

      return res.status(200).json({ applications,status:"OK",message:"All applicants Data" });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.approveApplication = async (req, res) => {
    try {
        const { userId } = req.params; 
        const approverId = req.id.id;  // ID of the user performing the approval (from auth middleware)
        const {approvedStatus,officerComment} = req.body
    // Fetch approver's name
        const approver = await User.findById(approverId).select('name');
        if (!approver) {
            return res.status(404).json({ error: 'Approver not found' });
        }


        const updatedApp = await Application.findOneAndUpdate(
            { user: userId },
            {
                $set: {
                status: approvedStatus,
                notes:officerComment,
                approvedBy: approver.name
                }
            },
            { new: true }
        );

        if (!updatedApp) {
        return res.status(404).json({ error: 'Application not found for the given user' });
        }

        // find user email and send the email to user
        const findUser = await User.findById(userId).select('email')

        const sendEmail = await transporter.sendMail({
            from:process.env.EMAIL_USER,
            to:findUser,
            subject:'Application Approved',
            html:`<h2>Your Applcation is Accepted!!</h2>`
        })

        return res.status(200).json({
            message: 'Application approved successfully',
            application: updatedApp,
            status:"OK"
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.userDetail = async(req,res)=>{
    const { id } = req.id;
    const approverId = req.id.id; 

    const user = await Application.find({ user: id })
    console.log(user,id,'get here ')
    try {
        if (!user) {
            return res.status(404).json({ error: 'User not found!' });
        }
        return res.status(200).json({userDetails:user,"message":"User Details!"})
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
    
}
