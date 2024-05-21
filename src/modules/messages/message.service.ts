import { Service } from "typedi";
import messageModel from "./message.model";
import mongoose from "mongoose";
import chatModel from "../chats/chat.model";

@Service()
export class MessageService {
  public createMessage = async (
    chatId: string,
    senderId: string,
    text: string
  ) => {
    //Create a new message
    const newMessage = await messageModel.create({
      chatId,
      senderId,
      text,
    });

    //Return the last message
    const lastMessge = await chatModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(chatId),
      },
      {
        lsmessage: text,
        lssender: new mongoose.Types.ObjectId(senderId),
      },
      {
        new: true,
      }
    );
    console.log("🚀 ~ MessageService ~ lastMessge:", lastMessge);

    return newMessage;
  };

  public getMessages = async (chatId: string, userId: string) => {
    await messageModel.updateMany(
      {
        $and: [
          { chatId: new mongoose.Types.ObjectId(chatId) },
          { isRead: false },
          { senderId: { $ne: new mongoose.Types.ObjectId(userId) } },
        ],
      },
      {
        isRead: true,
      }
    );

    const messages = await messageModel.find({
      chatId: new mongoose.Types.ObjectId(chatId),
    });

    return messages;
  };
}
