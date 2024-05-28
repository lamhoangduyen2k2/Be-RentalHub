import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { MessageController } from "./message.controller";

const messageRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare);
const messageController = Container.get(MessageController);

messageRoute.post(
  "/create-message",
  authMiddleware.authorized,
  messageController.createMessage
);

messageRoute.get(
  "/get-messages",
  authMiddleware.authorized,
  messageController.getMessages
);

messageRoute.get(
  "/get-messages-pagination",
  authMiddleware.authorized,
  messageController.getMessagesPagination
);

export default messageRoute;