import mongoose, { Schema } from "mongoose";

const userIdentitySchema = new mongoose.Schema(
  {
    _uId: {
      type: Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      unique: true,
    },
    _idCard: {
      type: String,
      required: [true, "ID Card is required"],
      unique: true,
    },
    _name: {
      type: String,
      required: [true, "Name is required"],
    },
    _dob: {
      type: String,
      required: [true, "Date of Birth is required"],
    },
    _home: {
      type: String,
      required: [true, "Home is required"],
    },
    _address: {
      type: String,
      required: [true, "Address is required"],
    },
    _gender: {
      type: String,
      required: [true, "Sex is required"],
    },
    _nationality: {
      type: String,
      required: [true, "National is required"],
    },
    _features: {
      type: String,
      required: [true, "Features is required"],
    },
    _issueDate: {
      type: String,
      required: [true, "Issue Date is required"],
    },
    _doe: {
      type: String,
      required: [true, "Date of Expiry is required"],
    },
    _issueLoc: {
      type: String,
      required: [true, "Issue Location is required"],
    },
    _type: {
      type: String,
      required: [true, "Type is required"],
    },
    _verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Indentities = mongoose.model("indentities", userIdentitySchema);
export default Indentities;
