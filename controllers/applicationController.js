
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

const Application = require("../models/Application")

exports.submitApp = async (req, res) => {
    try {
        const { father, address, city, state, visaType } = req.body
        const photo = req.files['photo']?.[0]?.filename
        const aadhar = req.files['aadhar']?.[0]?.filename
        const passport = req.files['passport']?.[0]?.filename
        const userId = req.id.id;

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
        })
        await newApplication.save()
        return res.status(201).json({ status: "OK", message: "Application Submitted successfully!" })
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

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

    // Fetch approver's name
        const approver = await User.findById(approverId).select('name');
        if (!approver) {
            return res.status(404).json({ error: 'Approver not found' });
        }

        const updatedApp = await Application.findOneAndUpdate(
            { user: userId },
            {
                $set: {
                status: 'approved',
                approvedBy: approver.name
                }
            },
            { new: true }
        );

        if (!updatedApp) {
        return res.status(404).json({ error: 'Application not found for the given user' });
        }

        return res.status(200).json({
            message: 'Application approved successfully',
            application: updatedApp,
            status:"OK"
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
