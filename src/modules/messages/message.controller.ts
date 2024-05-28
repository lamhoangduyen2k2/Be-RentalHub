import { Inject, Service } from "typedi";
import { MessageService } from "./message.service";
import { NextFunction, Request, Response } from "express";
import { Pagination, ResponseData } from "../../helpers/response";

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

  public getMessagesPagination = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const chatId = req.query.chatId ? req.query.chatId.toString() : undefined;
      const messages = await this.messageService.getMessagesPagination(chatId, req.body._uId.toString(), pagination);

      return res.json(new ResponseData(messages[0], null, messages[1]));
    } catch (error) {
      console.log("🚀 ~ MessageController ~ getMessages= ~ error:", error);
      next(error);
    }
  };
}
