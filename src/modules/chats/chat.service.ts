import { Service } from "typedi";
import chatModel from "./chat.model";
import { Errors } from "../../helpers/handle-errors";
import mongoose, { ClientSession } from "mongoose";
import { Pagination } from "../../helpers/response";

@Service()
export class ChatService {
  public createChat = async (
    firstId: string,
    secondId: string,
    session: ClientSession
  ) => {
    // Check chat is already exist
    const chat = await chatModel
      .findOne({
        members: {
          $all: [
            new mongoose.Types.ObjectId(firstId),
            new mongoose.Types.ObjectId(secondId),
          ],
        },
      })
      .session(session);

    if (chat) return chat;

    // Create new chat
    const newChat = await chatModel.create(
      [
        {
          members: [firstId, secondId],
        },
      ],
      { session }
    );

    if (newChat.length <= 0) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return newChat[0];
  };

  public findUserChats = async (userId: string) => {
    const chats = await chatModel.find({
      members: { $in: [new mongoose.Types.ObjectId(userId)] },
    });

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
            { members: { $in: [new mongoose.Types.ObjectId(userId)] } },
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
            { members: { $in: [new mongoose.Types.ObjectId(userId)] } },
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

      return {
        ...chat.toObject(),
        totalUnRead: totalUnRead ? totalUnRead.totalUnRead : 0,
      };
    });

    return {
      chats: unReadEachChat,
      totalUnReadMessages: totalUnReadMessages[0]
        ? totalUnReadMessages[0]["totalUnRead"]
        : 0,
    };
  };

  public findUserChatsPagination = async (
    userId: string,
    pagination: Pagination
  ) => {
    //Count total chats
    const totalChats = await chatModel.countDocuments({
      members: { $in: [new mongoose.Types.ObjectId(userId)] },
    });
    const totalPage = Math.ceil(totalChats / pagination.limit);
    if (pagination.page > totalPage) throw Errors.PageNotFound;

    const chats = await chatModel
      .find({ members: { $in: [new mongoose.Types.ObjectId(userId)] } })
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ updatedAt: -1 });

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
            { members: { $in: [new mongoose.Types.ObjectId(userId)] } },
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
            { members: { $in: [new mongoose.Types.ObjectId(userId)] } },
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

      return {
        ...chat.toObject(),
        totalUnRead: totalUnRead ? totalUnRead.totalUnRead : 0,
      };
    });

    return [
      {
        chats: unReadEachChat,
        totalUnReadMessages: totalUnReadMessages[0]
          ? totalUnReadMessages[0]["totalUnRead"]
          : 0,
      },
      { total: totalPage, page: pagination.page, limit: pagination.limit },
    ];
  };

  public findDetailUserChatsPagination = async (
    userId: string,
  ) => {
    const chats = await chatModel
      .aggregate([
        {
          $match: { members: { $in: [new mongoose.Types.ObjectId(userId)] } },
        },
        {
          $lookup: {
            from: "users",
            localField: "members",
            foreignField: "_id",
            let: { id_member: "$members" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ["$_id", "$$id_member"] },
                      { $ne: ["$_id", new mongoose.Types.ObjectId(userId)] },
                    ],
                  },
                },
              },
            ],
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            members: 1,
            lsmessage: 1,
            lssender: 1,
            "reciverName": {
              $concat: ["$user._fname", " ", "$user._lname"],
            },
            "reciverAvatar": "$user._avatar",
            createdAt: 1,
            updatedAt: 1,
          }
        }
      ])
      .sort({ updatedAt: -1 });

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
            { members: { $in: [new mongoose.Types.ObjectId(userId)] } },
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
            { members: { $in: [new mongoose.Types.ObjectId(userId)] } },
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

      return {
        ...chat,
        totalUnRead: totalUnRead ? totalUnRead.totalUnRead : 0,
      };
    });

    return {
      chats: unReadEachChat,
      totalUnReadMessages: totalUnReadMessages[0]
        ? totalUnReadMessages[0]["totalUnRead"]
        : 0,
    }
  };

  public findChat = async (firstId: string, secondId: string) => {
    const chat = await chatModel.findOne({
      members: {
        $all: [
          new mongoose.Types.ObjectId(firstId),
          new mongoose.Types.ObjectId(secondId),
        ],
      },
    });

    return chat;
  };
}
