import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { MessageController } from "./message.controller";

const messageRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare);
const messageController = Container.get(MessageController);

messageRoute.post(
  "/create-message",
  authMiddleware.authorizedUser,
  messageController.createMessage
);

messageRoute.get(
  "/get-messages",
  authMiddleware.authorizedUser,
  messageController.getMessages
);

export default messageRoute;