//import { NextFunction } from "express";
import mongoose, { Schema } from "mongoose";
import validator from "validator";
import { genSalt, hash } from "bcrypt";
import { NextFunction } from "express";

const usersSchema = new mongoose.Schema({
  _fname: {
    type: String,
    trim: true,
    default: null,
  },
  _lname: {
    type: String,
    trim: true,
    default: null,
  },
  _dob: {
    type: Date,
    default: null,
  },
  _phone: {
    type: String,
    default: null,
  },
  _address: {
    type: String,
    default: null,
  },
  _avatar: {
    type: String,
    default:
      "https://firebasestorage.googleapis.com/v0/b/rentalhub-a8ebf.appspot.com/o/userImg%2Fistockphoto-1300845620-612x612.jpg%20%20%20%20%20%20%202023-12-7%2011%3A27%3A36?alt=media&token=089d15fd-f21a-42c0-a397-288933e9c658".toString(),
  },
  _email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    validate: [validator.isEmail, "Email is invalid"],
  },
  _pw: {
    type: String,
    //required: [true, "Password is required"],
    default: null,
  },
  _active: {
    type: Boolean,
    default: true,
  },
  _rating: {
    type: Schema.Types.Number,
    default: 5.0,
  },
  _role: {
    type: Schema.Types.Number,
    default: 0,
  }, // 0: người dùng (có thể mua và thuê), 1: admin, 2: inspector
  _isHost: {
    type: Boolean,
    default: false,
  },
  _addressRental: {
    type: [String],
    default: [],
  },
  _totalReported: {
    type: Number,
    default: 0,
  },
  _temptHostBlocked: {
    type: Boolean,
    default: null,
  },
  _loginType: {
    type: String,
    default: "local",
  },
}, { timestamps: true });

usersSchema.pre("save", async function (next: NextFunction) {
  if (!this.isModified("_pw") || this._role === 0) return next();

  const salt = await genSalt(10);
  this._pw = await hash(this._pw, salt);
  next();
});

usersSchema.pre("updateOne", async function () {
  const data = this.getUpdate();

  if (data["_pw"]) {
    const salt = await genSalt(10);
    data["_pw"] = await hash(data["_pw"], salt);
  }
});



const Users = mongoose.model("users", usersSchema);
export default Users;
