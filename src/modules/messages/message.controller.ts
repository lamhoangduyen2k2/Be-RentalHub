import { Inject, Service } from "typedi";
import { MessageService } from "./message.service";
import { NextFunction, Request, Response } from "express";
import { ResponseData } from "../../helpers/response";

@Service()
export class MessageController {
  constructor(@Inject() private messageService: MessageService) {}

  public createMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { chatId, senderId, text } = req.body;
      const newMessage = await this.messageService.createMessage(
        chatId.toString(),
        senderId.toString(),
        text.toString()
      );

      return res.json(new ResponseData(newMessage, null, null));
    } catch (error) {
      console.log("🚀 ~ MessageController ~ createMessage= ~ error:", error);
      next(error);
    }
  };

  public getMessages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const chatId = req.query.chatId ? req.query.chatId.toString() : undefined;
      const messages = await this.messageService.getMessages(chatId, req.body._uId.toString());

      return res.json(new ResponseData(messages, null, null));
    } catch (error) {
      console.log("🚀 ~ MessageController ~ getMessages= ~ error:", error);
      next(error);
    }
  };
}
