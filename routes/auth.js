const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  JWT_SECRET
} = require('../config/config');

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

//  Send OTP
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

  let user = await User.findOne({ phone }) || new User({ phone });
  user.otp = otp;
  user.otpExpiresAt = expiry;
  await user.save();

  try {
    await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: TWILIO_PHONE_NUMBER,
      to: `+91${phone}`
    });

    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SMS failed', error: err.message });
  }
});

//  Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone });
  if (!user || user.otp !== otp || user.otpExpiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ success: true, token });
});

module.exports = router;
