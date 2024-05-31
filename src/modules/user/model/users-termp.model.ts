import mongoose from "mongoose";
import { genSalt, hash } from "bcrypt";

const userSTermpSchema = new mongoose.Schema({
  _fname: {
    type: String,
    required: [true, "First name is required"],
  },
  _lname: {
    type: String,
    required: [true, "Last name is required"],
  },
  _email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  _pw: {
    type: String,
    required: [true, "Password is required"],
  },
  expiredAt: {
    type: Date,
    expires: 3600,
  },
});

userSTermpSchema.pre("save", async function (next) {
  if (!this.isModified("_pw")) return next();

  const salt = await genSalt(10);
  this._pw = await hash(this._pw, salt);
  next();
});

userSTermpSchema.pre("updateOne", async function () {
  const data = this.getUpdate();

  if (data["_pw"]) {
    const salt = await genSalt(10);
    data["_pw"] = await hash(data["_pw"], salt);
  }
});

const UsersTermp = mongoose.model("usersTermp", userSTermpSchema);
export default UsersTermp;
