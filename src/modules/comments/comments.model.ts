import mongoose, { Schema } from "mongoose";
import Users from "../user/model/users.model";
import SocialPosts from "../social-posts/social-posts.model";

const commentsSchema = new mongoose.Schema({
    _uId: {
        type: Schema.Types.ObjectId,
        ref: Users,
        required: [true, "User ID is required"],
    },
    _postId: {
        type: Schema.Types.ObjectId,
        ref: SocialPosts,
        required: [true, "Post ID is required"],
    },
    _parentId: {
        type: Schema.Types.ObjectId,
        default: null,
    },
    _content: {
        type: String,
        required: [true, "Content is required"],
    },
}, { timestamps: true });

const Comments = mongoose.model("comments", commentsSchema);
export default Comments;