import { NextFunction } from "express";
import mongoose, { Schema } from "mongoose";
import validator from "validator";
import { genSalt, hash } from "bcrypt";

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
    default: null,
  },
  _email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    validate: [validator.isEmail, "Email is invalid"],
  },
  _pw: {
    type: String,
    required: [true, "Password is required"],
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
  }, // 0: người dùng (có thể mua và thuê), 1: hãng vận chuyển
  _isHost: {
    type: Boolean,
    default: false,
  },
});

usersSchema.pre("save", async function (next: NextFunction) {
  if (!this.isModified("_pw")) return next();

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
