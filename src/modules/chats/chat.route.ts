import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { ChatController } from "./chat.controller";

const chatRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare);
const chatController = Container.get(ChatController);

chatRoute.post(
  "/create-chat",
  authMiddleware.authorizedUser,
  chatController.createChat
);
chatRoute.get(
  "/find-user-chats",
  authMiddleware.authorizedUser,
  chatController.findUserChats
);
chatRoute.get(
  "/find-chat",
  authMiddleware.authorizedUser,
  chatController.findChat
);

export default chatRoute;
