import mongoose, { Schema } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    text: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const messageModel = mongoose.model("Message", messageSchema);

export default messageModel;