import express from "express";
import { PostsController } from "./posts.controller";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { ImageMiddleWare } from "../image/image.middleware";
import Container from "typedi";
import { PostsMiddleWare } from "./posts.middleware";
import { TagController } from "../tags/tag.controller";

const route = express.Router();
const postsController = Container.get(PostsController);
const postMiddleWare = Container.get(PostsMiddleWare);
const authMiddleware = Container.get(AuthenMiddWare);
const imageMiddleWare = Container.get(ImageMiddleWare);
const tagController = Container.get(TagController);

route.get("/", postsController.getAllPostsController);
route.get(
  "/history-post",
  authMiddleware.authorizedUser,
  postsController.getPostsByStatusController
);
route.get("/search-post", postsController.searchPost);
route.get("/search-post-tags", postsController.searchPostByTags);
route.get(
  "/get-post",
  authMiddleware.authorizedUser,
  postsController.getPostById
);
route.get(
  "/view-post-user",
  authMiddleware.authorizedUser,
  postsController.getPostOfUser
);
route.get(
  "/posts-similar",
  authMiddleware.authorizedUser,
  postsController.getPostSimilar
);
route.get(
  "/get-favorite-post",
  authMiddleware.authorizedUser,
  postsController.getFavoritePost
);
route.get(
  "/get-array-favorite-post",
  authMiddleware.authorizedUser,
  postsController.getArrayFavoritePosts
);
route.get(
  "/get-report-post",
  authMiddleware.authorizedInspector,
  postsController.getReportPost
);
route.get(
  "/get-report-post-id",
  authMiddleware.authorizedInspector,
  postsController.getReportPostByPostId
);
route.get(
  "/get-report-post-user",
  authMiddleware.authorizedUser,
  postsController.getReportedPostByUser
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
  "/update-post/:postId",
  imageMiddleWare.upload.array("_images"),
  imageMiddleWare.checkUploadImages,
  authMiddleware.authorizedUser,
  postMiddleWare.checkValidationUpdatePost,
  postsController.updatePost
);
route.patch(
  "/update-post-status/:postId",
  authMiddleware.authorizedUser,
  postsController.updatePostStatus
);
route.patch(
  "/sensor-post-reported/:reportedId",
  authMiddleware.authorizedInspector,
  postsController.sensorReportPost
);
route.post(
  "/favorite-post",
  authMiddleware.authorizedUser,
  postsController.createFavoritePost
);
route.post(
  "/report-post",
  authMiddleware.authorizedUser,
  postsController.createReportPost
);

//Tag
route.get("/get-tags", tagController.getAllTags);
route.post(
  "/create-tag",
  authMiddleware.authorizedUser,
  tagController.createTag
);

// Inspector
route.get(
  "/inspector-get-post",
  authMiddleware.authorizedInspector,
  postsController.getPostsByInspectorController
);
route.get(
  "/inspector-get-post-id",
  authMiddleware.authorizedInspector,
  postsController.getPostByIdInspector
);
route.get(
  "/inspector-get-post-status",
  authMiddleware.authorizedInspector,
  postsController.getPostsByStatusInspectorController
);
route.patch(
  "/sensor-post/:postId",
  authMiddleware.authorizedInspector,
  postsController.sensorPost
);

//Admin
route.get(
  "/admin-get-post-list",
  authMiddleware.authorizedAdmin,
  postsController.getPostsListByAdmin
);
route.get(
  "/admin-get-post-id",
  authMiddleware.authorizedAdmin,
  postsController.getPostByIdAdmin
);

export default route;
