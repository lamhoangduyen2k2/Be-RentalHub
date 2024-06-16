import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { CommentsMiddleware } from "./comments.middleware";
import { CommentsController } from "./comments.controller";
import { ImageMiddleWare } from "../image/image.middleware";

const commentsRoute = express.Router();
const authMiddeleware = Container.get(AuthenMiddWare);
const commentMiddleware = Container.get(CommentsMiddleware); 
const commentsController = Container.get(CommentsController);
const imageMiddleWare = Container.get(ImageMiddleWare);

//API POST
commentsRoute.post(
  "/create-comment",
  imageMiddleWare.upload.array("_images"),
  imageMiddleWare.checkUploadImages,
  authMiddeleware.authorizedUser,
  commentMiddleware.checkValidationCreateComment,
  commentsController.createComments
);