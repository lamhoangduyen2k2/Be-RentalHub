import mongoose, { Schema } from "mongoose";
import Posts from "../posts/models/posts.model";

const reportedShema = new mongoose.Schema({
  _content: {
    type: String,
    required: [true, "Content is required"],
  },
  _postId: {
    type: Schema.Types.ObjectId,
    ref: Posts,
  },
  _uId: {
    type: Schema.Types.ObjectId,
    ref: Posts,
  },
  _active: {
    type: Boolean,
    required: [true, "Active is required!"],
    default: true,
  },
});

const Reported = mongoose.model("reported", reportedShema);
export default Reported;
