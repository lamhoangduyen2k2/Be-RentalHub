import mongoose, { Schema } from "mongoose";
import Users from "../user/model/users.model";

const socialPostsSchema = new mongoose.Schema({
    _title: {
        type: String,
        required: [true, "Title is required"],
        index: true,
    },
    _content: {
        type: String,
        required: [true, "Content is required"],
    },
    _images: {
        type: String,
        trim: true,
        default: null,
    },
    _uId: {
        type: Schema.Types.ObjectId,
        ref: Users,
    },
    _totalComment: {
        type: Number,
        default: 0,
    },
    _totalLike: {
        type: Number,
        default: 0,
    },
    _status: {
        type: Number,
        default: 0, //O: public, 1: block, 2: resported
    },
    _inspectId: {
        type: Schema.Types.ObjectId,
        ref: Users,
        default: null,
    },
    _reason: {
        type: String,
        default: null,
    }
}, { timestamps: true });

socialPostsSchema.index({ _title: "text", _content: "text" });

const SocialPosts = mongoose.model("social-posts", socialPostsSchema);

export default SocialPosts;