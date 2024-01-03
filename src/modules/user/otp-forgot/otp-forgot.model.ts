import mongoose from "mongoose";
import Users from "../model/users.model";

const otpForgotSchema = new mongoose.Schema({
  _email: {
    type: String,
    unique: true,
    ref: Users,
  },
  _otp: {
    type: String,
  },
  _isVerify: {
    type: Boolean,
    default: false,
  },
  expiredAt: {
    type: Date,
    expires: 120,
  },
});

const otpForgot = mongoose.model("otp-forgot", otpForgotSchema);
export default otpForgot;
