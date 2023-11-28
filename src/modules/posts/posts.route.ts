import express from "express";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { AuthService } from "../auth/auth.service";
import { ImageMiddleWare } from "../image/image.middleware";
import Container from "typedi";
import { PostsMiddleWare } from "./posts.middleware";
import { TagController } from "../tags/tag.controller";

const route = express.Router();
const postsController = new PostsController(new PostsService());
const postMiddleWare = Container.get(PostsMiddleWare);
const authMiddleware = new AuthenMiddWare(new AuthService());
const imageMiddleWare = Container.get(ImageMiddleWare);
const tagController = Container.get(TagController);

route.get("/", postsController.getAllPostsController);
route.get(
  "/history-post",
  authMiddleware.authorizedUser,
  postsController.getPostsByStatusController
);
route.get(
  "/search-post",
  postsController.searchPost
);
route.post(
  "/create-post",
  imageMiddleWare.upload.array("_images"),
  imageMiddleWare.checkUploadImages,
  authMiddleware.authorizedUser,
  postMiddleWare.checkValidationCreatePost,
  postsController.createNewPost
);
route.patch(
  "/sensor-post/:postId",
  authMiddleware.authorizedInspector,
  postsController.sensorPost
);
route.patch(
  "/update-post/:postId",
  imageMiddleWare.upload.array("_images"),
  imageMiddleWare.checkUploadImages,
  authMiddleware.authorizedUser,
  postsController.updatePost
);

//Tag
route.get("/get-tags", authMiddleware.authorizedUser, tagController.getAllTags);
route.post(
  "/create-tag",
  authMiddleware.authorizedUser,
  tagController.createTag
);

export default route;
