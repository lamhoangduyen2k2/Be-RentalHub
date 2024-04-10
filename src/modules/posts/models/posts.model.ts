import mongoose, { Schema } from "mongoose";
import Users from "../../user/model/users.model";
import Rooms from "../../rooms/rooms.model";

const postsSchema = new mongoose.Schema(
  {
    _active: {
      type: Boolean,
      default: true,
    },
    _content: {
      type: String,
      required: [true, "Content is required"],
    },
    _status: {
      type: Schema.Types.Number,
      default: 0, //O: draft, 1: public, 2: delete, 3: reported
    },
    _tags: {
      type: [Schema.Types.ObjectId],
      required: [true, "Tags is required!"],
    },
    _videos: {
      type: [String],
      trim: true,
      default: null,
    },
    _images: {
      type: [String],
      trim: true,
      default: null,
    },
    _title: {
      type: String,
      required: [true, "Title is required"],
      index: true,
    },
    _uId: {
      type: Schema.Types.ObjectId,
      ref: Users,
    },
    _desc: {
      type: String,
      required: [true, "Description is required"],
    },
    _rooms: {
      type: Schema.Types.ObjectId,
      ref: Rooms,
      required: [true, "Rooms is required"],
    },
    _inspectId: {
      type: Schema.Types.ObjectId,
      ref: Users,
    },
  },
  {
    timestamps: true,
  }
);

postsSchema.index({ _title: "text" });

const Posts = mongoose.model("posts", postsSchema);
export default Posts;
