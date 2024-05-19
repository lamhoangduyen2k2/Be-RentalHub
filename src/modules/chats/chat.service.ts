import { Service } from "typedi";
import chatModel from "./chat.model";
import { Errors } from "../../helpers/handle-errors";
import mongoose from "mongoose";

@Service()
export class ChatService {
  public createChat = async (firstId: string, secondId: string) => {
    // Check chat is already exist
    const chat = await chatModel.findOne({
      members: { $all: [firstId, secondId] },
    });

    if (chat) return chat;

    // Create new chat
    const newChat = await chatModel.create({
      members: [firstId, secondId],
    });

    if (!newChat) throw Errors.SaveToDatabaseFail;

    return newChat;
  };

  public findUserChats = async (userId: string) => {
    const chats = await chatModel.find({ members: { $in: [userId] } });

    const totalUnReadMessages = await chatModel.aggregate([
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "chatId",
          as: "mess",
        },
      },
      { $unwind: "$mess" },
      {
        $match: {
          $and: [
            { "mess.isRead": false },
            { "mess.senderId": { $ne: new mongoose.Types.ObjectId(userId) } },
            { members: { $in: [userId] } },
          ],
        },
      },
      {
        $count: "totalUnRead",
      },
      {
        $project: {
          _id: 1,
          totalUnRead: 1,
        },
      },
    ]);

    const totalUnReadMessagesChat = await chatModel.aggregate([
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "chatId",
          as: "mess",
        },
      },
      { $unwind: "$mess" },
      {
        $match: {
          $and: [
            { "mess.isRead": false },
            { "mess.senderId": { $ne: new mongoose.Types.ObjectId(userId) } },
            { members: { $in: [userId] } },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          totalUnRead: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 1,
          totalUnRead: 1,
        },
      },
    ]);

    const unReadEachChat = chats.map((chat) => {
      const totalUnRead = totalUnReadMessagesChat.find((total) => {
        return total._id.toString() === chat._id.toString();
      });
      console.log("🚀 ~ ChatService ~ totalUnRead ~ totalUnRead:", totalUnRead)

      return {
        ...chat.toObject(),
        totalUnRead: totalUnRead ? totalUnRead.totalUnRead : 0,
      };
    });

    return {
      chats: unReadEachChat,
      totalUnReadMessages: totalUnReadMessages[0],
    };
  };

  public findChat = async (firstId: string, secondId: string) => {
    const chat = await chatModel.findOne({
      members: { $all: [firstId, secondId] },
    });

    return chat;
  };
}
