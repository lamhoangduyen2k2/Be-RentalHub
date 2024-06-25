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
  "/get-social-post-id",
  authMiddeleware.authorizedUser,
  socialPostController.getSocialPostById
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
)
socialRoute.patch(
  "/react-social-post",
  authMiddeleware.authorizedUser,
  socialPostController.reactSocialPost
)

export default socialRoute;
