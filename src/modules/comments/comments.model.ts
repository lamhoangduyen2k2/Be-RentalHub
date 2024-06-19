import mongoose, { Schema } from "mongoose";
import Users from "../user/model/users.model";
import SocialPosts from "../social-posts/social-posts.model";

const statusEnum = [0, 1]

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
    _rootId: {
        type: Schema.Types.ObjectId,
        default: null, 
    },
    _content: {
        type: String,
        required: [true, "Content is required"],
    },
    _images: {
        type: [String],
        default: [],
    },
    _status: {
        type: Number,
        enum: statusEnum,                     
        default: 0 // 0: active, 1: inactive
    },
}, { timestamps: true });

const Comments = mongoose.model("comments", commentsSchema);
export default Comments;