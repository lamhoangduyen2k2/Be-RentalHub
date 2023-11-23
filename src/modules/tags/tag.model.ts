import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
  _type: {
    type: String,
    default: "service",
    trim: true,
  },
  _tag: {
    type: String,
    required: [true, "Tag is required"],
  },
});

const Tags = mongoose.model("tags", tagSchema);
export default Tags;
