import mongoose, { Schema } from "mongoose";
import Users from "../user/users.model";
import Inspectors from "../inspectors/inspectors.model";

const postsSchema = new mongoose.Schema({
  _active: {
    type: Boolean,
    default: false,
  },
  _content: {
    type: String,
    required: [true, "Content is required"],
  },
  _postingDate: {
    type: Date,
    default: Date.now(),
  },
  _status: {
    type: Schema.Types.Number,
    default: 0,
  },
  _tags: [Schema.Types.ObjectId],
  _videos: {
    type: [String],
    trim: true,
  },
  _images: {
    type: [String],
    trim: true,
  },
  _title: {
    type: String,
    required: [true, "Title is required"],
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
    type: [Schema.Types.ObjectId],
    required: [true, "Rooms is required"],
  },
  _inspectId: {
    type: Schema.Types.ObjectId,
    ref: Inspectors,
  },
});

const Posts = mongoose.model("posts", postsSchema);
export default Posts;
