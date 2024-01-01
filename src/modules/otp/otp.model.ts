import mongoose, { Schema } from "mongoose";
import Users from "../user/users.model";

const otpSchema = new mongoose.Schema({
  _uId: {
    type: Schema.Types.ObjectId,
    unique: [true, "This user had an otp"],
    ref: Users,
  },
  _otp: {
    type: String,
  },
  expiredAt: {
    type: Date,
    expires: 120,
  },
});

const OTP = mongoose.model("otp", otpSchema);
export default OTP;
