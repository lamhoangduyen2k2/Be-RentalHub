import express from "express";
import passport from "passport";
import Container from "typedi";
import { AuthenMiddWare } from "./auth.middleware";
import { AuthController } from "./auth.controller";

const authRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare);
const authController = Container.get(AuthController);

authRoute.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

authRoute.get(
  "/google/callback",
  authMiddleware.googleCallback,
  authController.loginByGoogleController
);

export default authRoute;
