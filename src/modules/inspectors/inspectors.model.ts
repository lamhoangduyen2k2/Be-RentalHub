import mongoose from "mongoose";
import validator from "validator";

const inspectorsSchema = new mongoose.Schema({
  _fname: {
    type: String,
    required: [true, "Firstname is required"],
  },
  _lname: {
    type: String,
    required: [true, "Lastname is required"],
  },
  _dob: {
    type: Date,
    validate: [validator.isDate, "DOB is invalid"],
  },
  _phone: {
    type: String,
  },
  _address: {
    type: String,
  },
  _avatar: {
    type: String,
  },
  _email: {
    type: String,
    required: [true, "Email is required"],
    validate: [validator.isEmail, "Email is invalid"],
  },
  _pw: {
    type: String,
    required: [true, "Password is required"],
    validate: [
      validator.isStrongPassword,
      "Password must have 8 charaters at least, 1 lowercase, 1 uppercase, 1 sysmbol, 1 number",
    ],
  },
  _active: {
    type: Boolean,
    default: true,
  },
});

const Inspectors = mongoose.model("inspectors", inspectorsSchema);
export default Inspectors;
