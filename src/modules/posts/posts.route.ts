import express from "express";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { AuthService } from "../auth/auth.service";
import { ImageMiddleWare } from "../image/image.middleware";
import Container from "typedi";

const route = express.Router();
const postsController = new PostsController(new PostsService());
const authMiddleware = new AuthenMiddWare(new AuthService());
const imageMiddleWare = Container.get(ImageMiddleWare);

route.get("/", postsController.getAllPostsController);
route.post(
  "/create-post",
  imageMiddleWare.upload.array("_images"),
  imageMiddleWare.checkUploadImages,
  authMiddleware.authorizedUser,
  postsController.createNewPost
);
route.patch(
  "/sensor-post/:postId",
  authMiddleware.authorizedInspector,
  postsController.sensorPost
);
route.patch(
  "/update-post/:postId",
  authMiddleware.authorizedUser,
  postsController.updatePost
);

export default route;
