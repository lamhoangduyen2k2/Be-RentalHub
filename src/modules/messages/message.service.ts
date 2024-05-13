import { Service } from "typedi";
import messageModel from "./message.model";
import mongoose from "mongoose";

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

    return newMessage;
  };

  public getMessages = async (chatId: string) => {
    const messages = await messageModel.find({
      chatId: new mongoose.Types.ObjectId(chatId),
    });

    return messages;
  };
}
