import mongoose from "mongoose";

const reportedPostsSchema = new mongoose.Schema(
  {
    _uId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    _postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
    },
    _content: {
      type: String,
    },
    _uIdReported: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  },
  { timestamps: true }
);

const ReportedPosts = mongoose.model("reportedPosts", reportedPostsSchema);
export default ReportedPosts;
