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

const transporter = require("../config/mailer");
const Application = require("../models/Application");
const User = require("../models/User");
const ExcelJS = require("exceljs");

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
    const photo = req.files["photo"]?.[0]?.filename;
    const aadhar = req.files["aadhar"]?.[0]?.filename;
    const passport = req.files["passport"]?.[0]?.filename;
    const userId = req.id.id;

    // Check if user has already submitted an application
    const existingApp = await Application.findOne({ user: userId });
    if (existingApp) {
      return res.status(402).json({
        status: "error",
        message: "You have already submitted an application.",
      });
    }

    const newApplication = new Application({
      user: userId,
      visaType,
      father,
      address,
      city,
      state,
      photo: photo || "",
      aadhar: aadhar || "",
      passport: passport || "",
    });

    await newApplication.save();

    return res
      .status(201)
      .json({ status: "OK", message: "Application Submitted successfully!" });
  } catch (error) {
    console.log(error, "get error here ");
    res.status(500).json({ error: "Server error" });
  }
};

exports.applications = async (req, res) => {
  try {
    const applications = await Application.find().populate({
      path: "user",
      select: "-password -otp", // exclude sensitive user fields
    });

    return res
      .status(200)
      .json({ applications, status: "OK", message: "All applicants Data" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const approverId = req.id.id; // ID of the user performing the approval (from auth middleware)
    const { approvedStatus, officerComment } = req.body;
    console.log(approvedStatus,officerComment,'get officer comment here ')
    // Fetch approver's name
    const approver = await User.findById(approverId).select("name");
    if (!approver) {
      return res.status(404).json({ error: "Approver not found" });
    }

    const updatedApp = await Application.findOneAndUpdate(
      { user: id },
      {
        $set: {
          status: approvedStatus,
          notes: officerComment,
          approvedBy: approver.name,
        },
      },
      { new: true }
    );

    if (!updatedApp) {
      return res
        .status(404)
        .json({ error: "Application not found for the given user" });
    }

    // find user email and send the email to user
    const findUser = await User.findById(id).select("email");
    let emailMessage = "";
    if (approvedStatus === "accepted") {
      emailMessage = `<p style="color:green; font-weight:bold;">Yupp! Your application has been <strong>accepted</strong> by <strong>VizaVerify</strong> Company.</p>`;
    } else if (approvedStatus === "rejected") {
      emailMessage = `<p style="color:red; font-weight:bold;">Sorry! Your application has been <strong>rejected</strong> by <strong>VizaVerify</strong> Company. Kindly check your status for more information.</p>`;
    } else {
      emailMessage = `<p>Your application status has been updated by VizaVerify Company. Please log in to view the changes.</p>`;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: findUser?.email,
      subject: "Application Status Update - VizaVerify",
      html: `
        <div style="font-family: Arial, sans-serif; border:1px solid #e5e5e5; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3b3dc4;">VizaVerify</h2>
          ${emailMessage}
          <p style="margin-top: 20px;">Regards,<br/><strong>VizaVerify Team</strong></p>
        </div>
      `,
    });

    return res.status(200).json({
      message:approvedStatus === "accepted"? "Application approved successfully":"Application Rejected .",
      application: updatedApp,
      status: "OK",
    });
  } catch (error) {
    console.log(error, "gerr erorr");
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.userDetail = async (req, res) => {
  const { id } = req.id;
  const approverId = req.id.id;

  const user = await Application.find({ user: id });
  console.log(user, id, "get here ");
  try {
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }
    return res
      .status(200)
      .json({ userDetails: user, message: "User Details!" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
exports.excelApplication = async (req, res) => {
  try {
    // Fetch all applications with populated user data
    const applications = await Application.find().populate("user").lean();

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Applications");

    // Define columns for the Excel sheet
    worksheet.columns = [
      { header: "Visa Type", key: "visaType", width: 15 },

      { header: "Father Name", key: "father", width: 20 },
      { header: "Address", key: "address", width: 30 },
      { header: "City", key: "city", width: 15 },
      { header: "State", key: "state", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Notes", key: "notes", width: 30 },
      { header: "Approved By", key: "approvedBy", width: 20 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Add rows to the worksheet
    applications.forEach((app) => {
      worksheet.addRow({
        visaType: app.visaType || "N/A",
        father: app.father || "N/A",
        address: app.address || "N/A",
        city: app.city || "N/A",
        state: app.state || "N/A",
        status: app.status || "N/A",
        notes: app.notes || "N/A",
        approvedBy: app.approvedBy || "N/A",
        createdAt: app.createdAt
          ? new Date(app.createdAt).toLocaleString()
          : "N/A",
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDDDDDD" },
    };

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Applications.xlsx"
    );

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting applications:", error);
    res.status(500).json({ message: "Error exporting applications to Excel" });
  }
};


//dashboard apis 

exports.applicationStatusStats = async (req, res) => {
  try {
    // Count applications by status
    const statusCounts = await Application.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Format for chart
    const formattedData = [
      { name: "Approved", value: 0, color: "#52c41a" },
      { name: "Pending", value: 0, color: "#faad14" },
      { name: "Rejected", value: 0, color: "#ff4d4f" },
    ];

    statusCounts.forEach(item => {
      const index = formattedData.findIndex(d => d.name.toLowerCase() === item._id);
      if (index !== -1) {
        formattedData[index].value = item.count;
      }
    });

    return res.status(200).json({ status: 'OK', data: formattedData });
  } catch (error) {
    console.error("Error fetching application status stats:", error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};


//current month tak k api 

exports.monthlyApplications2025 = async (req, res) => {
  try {
    const startOfYear = new Date('2025-01-01');
    const now = new Date(); // current date

    const data = await Application.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lte: now
          }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          applications: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.month": 1 }
      }
    ]);

    // Map month number to name
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const result = [];

    for (let i = 0; i < now.getMonth() + 1; i++) {
      const found = data.find(d => d._id.month === i + 1);
      result.push({
        month: monthNames[i],
        applications: found ? found.applications : 0
      });
    }

    return res.status(200).json({ status: "OK", data: result });
  } catch (error) {
    console.error("Error fetching monthly applications:", error);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};


// PUT /api/account/:id/deactivate-and-reject


exports.deactivateAndReject = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find and deactivate the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    user.isActive = false;
    await user.save();

    // 2. Reject the user's application
    const application = await Application.findOneAndUpdate(
      { user: id },
      {
        $set: {
          status: "rejected",
          notes: "Account deactivated by system.",
        },
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ status: "error", message: "Application not found" });
    }

    // 3. Send email to user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Account Deactivation & Application Rejection - VizaVerify",
      html: `
        <div style="font-family: Arial, sans-serif; border:1px solid #e5e5e5; padding: 20px; border-radius: 8px;">
          <h2 style="color: #c40000;">VizaVerify Notification</h2>
          <p style="color: red;"><strong>Your account has been deactivated and your visa application has been rejected.</strong></p>
          <p>Please contact our support team if you believe this was a mistake.</p>
          <p style="margin-top: 20px;">Regards,<br/><strong>VizaVerify Team</strong></p>
        </div>
      `,
    });

    return res.status(200).json({
      status: "OK",
      message: "User deactivated, application rejected, and email sent.",
      user,
      application,
    });
  } catch (error) {
    console.error("Error in deactivateAndReject:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

