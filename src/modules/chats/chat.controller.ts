import { Inject, Service } from "typedi";
import { ChatService } from "./chat.service";
import { NextFunction, Request, Response } from "express";
import { ResponseData } from "../../helpers/response";

@Service()
export class ChatController {
  constructor(@Inject() private chatService: ChatService) {}

  public createChat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const firstId = req.body.firstId.toString();
      const secondId = req.body.secondId.toString();
      const chat = await this.chatService.createChat(firstId, secondId);

      res.json(new ResponseData(chat, null, null));
    } catch (error) {
      console.log("🚀 ~ ChatController ~ createChat= ~ error:", error);
      next(error);
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
}
