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
      const { firstId, secondId } = req.body;
      const chat = await this.chatService.createChat(
        firstId.toString(),
        secondId.toString()
      );

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
      const { userId } = req.params;
      const chats = await this.chatService.findUserChats(userId.toString());

      res.json(new ResponseData(chats, null, null));
    } catch (error) {
      console.log("🚀 ~ ChatController ~ findUserChats= ~ error:", error);
      next(error);
    }
  };

  public findChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { firstId, secondId } = req.params;
      const chat = await this.chatService.findChat(
        firstId.toString(),
        secondId.toString()
      );

      res.json(new ResponseData(chat, null, null));
    } catch (error) {
      console.log("🚀 ~ ChatController ~ findChat= ~ error:", error);
      next(error);
    }
  };
}
