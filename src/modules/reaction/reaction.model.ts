import mongoose, { Schema } from "mongoose";

const reactionSchema = new mongoose.Schema({
    _uId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    _postId: {
        type: Schema.Types.ObjectId,
        ref: "social-posts",
        required: true,
    },
    _like: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Reaction = mongoose.model("reactions", reactionSchema);
export default Reaction;