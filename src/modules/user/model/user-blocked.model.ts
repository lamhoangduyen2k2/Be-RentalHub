import mongoose, { Schema } from "mongoose";
import Users from "./users.model";
import Indentities from "./users-identity.model";

const userBlockedShema = new mongoose.Schema(
  {
    _uId: {
      type: Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      unique: true,
      ref: Users,
    },
    _idCard: {
      type: String,
      unique: true,
      ref: Indentities,
    },
    _email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      ref: Users,
    },
    _phone: {
      type: String,
      unique: true,
      ref: Users,
    },
    _reason: {
      type: String,
      required: [true, "Reason is required"],
    },
    _status: {
      type: Number,
      default: 0, //0: blocked, 1: unblocked
    },
    _createdBy: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: Users,
    },
  },
  { timestamps: true }
);

const UserBlocked = mongoose.model("user-blocked", userBlockedShema);
export default UserBlocked;
