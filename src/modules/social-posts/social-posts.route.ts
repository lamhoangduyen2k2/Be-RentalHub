import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { SocialPostsController } from "./social-posts.controller";
import { SocialPostMiddleware } from "./social-post.middleware";
import { ImageMiddleWare } from "../image/image.middleware";

const socialRoute = express.Router();
const authMiddeleware = Container.get(AuthenMiddWare);
const socialPostMiddleware = Container.get(SocialPostMiddleware);
const socialPostController = Container.get(SocialPostsController);
const imageMiddleWare = Container.get(ImageMiddleWare);

//Customer
//API GET
socialRoute.get(
  "/",
  authMiddeleware.authorizedUser,
  socialPostController.getSocilaPosts
);
socialRoute.get(
  "/search-social-medias",
  authMiddeleware.authorizedUser,
  socialPostController.searchSocialMediaByKeyword
);

//API POST
socialRoute.post(
  "/create-social-post",
  imageMiddleWare.upload.single("_image"),
  imageMiddleWare.checkUploadAvatar,
  authMiddeleware.authorizedUser,
  socialPostMiddleware.checkValidationCreateSocialPost,
  socialPostController.createSocialPost
);
socialRoute.post(
  "/report-social-post",
  authMiddeleware.authorizedUser,
  socialPostController.reportSocialPost
);

//API PATCH
socialRoute.patch(
  "/update-social-post",
  imageMiddleWare.upload.single("_image"),
  imageMiddleWare.checkUploadAvatar,
  authMiddeleware.authorizedUser,
  socialPostMiddleware.checkValidationUpdateSocialPost,
  socialPostController.updateSocialPost
);

socialRoute.delete(
  "/cancle-social-post",
  authMiddeleware.authorizedUser,
  socialPostController.cancleSocialPost
);
socialRoute.patch(
  "/react-social-post",
  authMiddeleware.authorizedUser,
  socialPostController.reactSocialPost
);

//Inspector
//API PATCH

//Admin
//API PATCH

//Admin and Inspector
//API GET
socialRoute.get(
  "/get-social-posts-status",
  authMiddeleware.authorizedInspector,
  socialPostController.getdSocialPostsByStatus
);
socialRoute.get(
  "/get-reported-social-post",
  authMiddeleware.authorized,
  socialPostController.getReportedSocialPosts
);
socialRoute.get(
  "/get-reported-social-post-id",
  authMiddeleware.authorized,
  socialPostController.getReportedSocialPostById
);
socialRoute.get(
  "/search-social-posts-keyword",
  authMiddeleware.authorizedInspector,
  socialPostController.searchSocialPostByKeyword
);

//API PATCH
socialRoute.patch(
  "/sensor-reported-request",
  authMiddeleware.authorizedInspector,
  socialPostController.sensorReportedSocialPost
);

//Admin
//API PATCH
socialRoute.patch(
  "/admin/block-social-post",
  authMiddeleware.authorizedAdmin,
  socialPostController.unBlockSocialPost
);

//Common
//API GET
socialRoute.get(
  "/get-social-post-id",
  authMiddeleware.authorized,
  socialPostController.getSocialPostById
);

export default socialRoute;
