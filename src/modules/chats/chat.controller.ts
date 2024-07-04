import { Inject, Service } from "typedi";
import { ChatService } from "./chat.service";
import { NextFunction, Request, Response } from "express";
import { Pagination, ResponseData } from "../../helpers/response";
import { startSession } from "mongoose";
// import Users from "../user/model/users.model";
// import chatModel from "./chat.model";

@Service()
export class ChatController {
  constructor(@Inject() private chatService: ChatService) {}

  public createChat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const firstId = req.body.firstId.toString();
      const secondId = req.body.secondId.toString();
      session.startTransaction();
      const chat = await this.chatService.createChat(firstId, secondId, session);

      res.json(new ResponseData(chat, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ ChatController ~ createChat= ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  public findUserChats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.query.userId ? req.query.userId.toString() : undefined;
      const chats = await this.chatService.findUserChats(userId);

      res.json(new ResponseData(chats, null, null));
    } catch (error) {
      console.log("🚀 ~ ChatController ~ findUserChats= ~ error:", error);
      next(error);
    }
  };

  public findUserChatsPagination = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.query.userId ? req.query.userId.toString() : undefined;
      const pagination = Pagination.getPagination(req);
      const chats = await this.chatService.findUserChatsPagination(userId, pagination);

      res.json(new ResponseData(chats[0], null, chats[1]));
    } catch (error) {
      console.log("🚀 ~ ChatController ~ findUserChats= ~ error:", error);
      next(error);
    }
  };

  public findDetailUserChatsPagination = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.query.userId ? req.query.userId.toString() : undefined;
      const chats = await this.chatService.findDetailUserChatsPagination(userId);

      res.json(new ResponseData(chats, null,null));
    } catch (error) {
      console.log("🚀 ~ ChatController ~ findUserChats= ~ error:", error);
      next(error);
    }
  };

  public findChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const firstId = req.query.firstId
        ? req.query.firstId.toString()
        : undefined;
      const secondId = req.query.secondId
        ? req.query.secondId.toString()
        : undefined;
      const chat = await this.chatService.findChat(firstId, secondId);

      res.json(new ResponseData(chat, null, null));
    } catch (error) {
      console.log("🚀 ~ ChatController ~ findChat= ~ error:", error);
      next(error);
    }
  };

  // public createChatWithAdmin = async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const user = await Users.find({
  //       _role: 0
  //     })

  //     user.forEach(async (element) => {
  //       await chatModel.create({
  //         members: [element._id.toString(), "65418310bec0ba49c4d9a276"],
  //       })

  //     });

  //     res.json(new ResponseData(true, null, null));
  //   } catch (error) {
  //     console.log("🚀 ~ ChatController ~ createChatWithAdmin= ~ error:", error);
  //     next(error);
  //   }
  // }
  
}
