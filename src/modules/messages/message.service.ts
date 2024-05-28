import { Service } from "typedi";
import messageModel from "./message.model";
import mongoose from "mongoose";
import chatModel from "../chats/chat.model";
import { Pagination } from "../../helpers/response";
import { Errors } from "../../helpers/handle-errors";

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

  public getMessagesPagination = async (
    chatId: string,
    userId: string,
    pagination: Pagination
  ) => {
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

    //Count total messages
    const totalMessages = await messageModel.countDocuments({
      chatId: new mongoose.Types.ObjectId(chatId),
    });
    if (totalMessages <= 0) throw Errors.MessagesNotFound;

    //Caculate total pages
    const totalPages = Math.ceil(totalMessages / pagination.limit);
    if (pagination.page > totalPages) throw Errors.PageNotFound;

    const messages = await messageModel
      .find({
        chatId: new mongoose.Types.ObjectId(chatId),
      })
      .sort({ createdAt: -1 })
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (messages.length <= 0) throw Errors.MessagesNotFound;

    return [messages, { page: pagination.page, limit: pagination.limit, total: totalPages }];
  };
}
