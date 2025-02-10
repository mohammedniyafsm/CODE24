require("dotenv").config();
const nodemailer = require("nodemailer");

const sendOtpEmail = async (email, otp) => {
  try {
    if (!email) {
      throw new Error("Recipient email is missing");
    }

    console.log("Sending OTP email to:", email); // Debug log

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Yen-Learning" <${process.env.EMAIL}>`,
      to: email,
      subject: "Yen-Learning: Email Verification",
      text: `${otp} is your Yen-Learning verification code.\n\nPlease enter this code to verify your email.\n\nThank you, \nYen-Learning Team.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);

    return { success: true, message: "OTP email sent successfully." };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Failed to send OTP email.", error };
  }
};

module.exports = { sendOtpEmail };
