import mongoose, { Schema } from "mongoose";
import messageModel from "../messages/message.model";

const chatSchema = new mongoose.Schema(
  {
    members: {
      type: [Schema.Types.ObjectId],
      default: null,
    },
    lsmessage: {
      type: String,
      default: null,
    },
    lssender: {
      type: Schema.Types.ObjectId,
      ref: messageModel,
      default: null,
    },
  },
  { timestamps: true }
);

const chatModel = mongoose.model("Chat", chatSchema);

export default chatModel;
