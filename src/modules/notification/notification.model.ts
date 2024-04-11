import mongoose, { Schema } from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    _uId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    _postId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "posts",
    },
    _addressId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "address-rentals",
    },
    _title: {
      type: String,
      required: true,
    },
    _message: {
      type: String,
      required: true,
    },
    _read: {
      type: Boolean,
      default: false,
    },
    _type: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("notification", notificationSchema);
export default Notification;
