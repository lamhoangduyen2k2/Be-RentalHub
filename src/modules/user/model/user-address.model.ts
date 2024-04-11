import mongoose, { Schema } from "mongoose";

const addressRentalSchema = new mongoose.Schema(
  {
    _uId: {
      type: Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      unique: true,
    },
    _address: {
      type: String,
      required: [true, "Address is required"],
      unique: true,
    },
    _totalRoom: {
      type: Number,
      default: 1,
    },
    _imgLicense: {
      type: [String],
      default: [],
    },
    _status: {
      type: Number,
      default: 0,
    },
    _active: {
      type: Boolean,
      default: true,
    },
    _inspectorId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    _reason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const addressRental = mongoose.model("address-rental", addressRentalSchema);
export default addressRental;
