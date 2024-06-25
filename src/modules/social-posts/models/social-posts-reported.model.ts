import mongoose, { Schema } from "mongoose";
import SocialPosts from "./social-posts.model";
import Users from "../../user/model/users.model";

const reportedSocialPostSchema = new Schema(
  {
    _uId: {
      type: [Schema.Types.ObjectId],
      ref: Users,
      required: [true, "User is required"],
    },
    _postId: {
      type: Schema.Types.ObjectId,
      ref: SocialPosts,
      required: [true, "Id of social-post is required"],
    },
    _reason: {
      type: [String],
      required: [true, "Reasons are required"],
    },
    _uIdReported: {
      type: Schema.Types.ObjectId,
      ref: Users,
      required: [true, "User reported is required"],
    },
    _isSensored: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ReportedSocialPosts = mongoose.model(
  "reported-social-posts",
  reportedSocialPostSchema
);
export default ReportedSocialPosts;
