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
  authMiddleware.authorized,
  chatController.findUserChats
);
chatRoute.get(
  "/find-user-chats-pagination",
  authMiddleware.authorized,
  chatController.findUserChatsPagination
);
chatRoute.get(
  "/find-chat",
  authMiddleware.authorized,
  chatController.findChat
);
// chatRoute.post(
//   "/create-chat-with-admin",
//   authMiddleware.authorizedUser,
//   chatController.createChatWithAdmin
// );

export default chatRoute;
