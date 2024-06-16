import mongoose, { Schema } from "mongoose";
import Users from "../user/model/users.model";
import Posts from "../posts/models/posts.model";
import addressRental from "../user/model/user-address.model";

const notificationSchema = new mongoose.Schema(
  {
    _uId: {
      type: Schema.Types.ObjectId,
      ref: Users,
      required: true,
    },
    _senderId: {
      type: Schema.Types.ObjectId,
      ref: Users,
      default: null,
    },
    _postId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: Posts,
    },
    _addressId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: addressRental,
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
