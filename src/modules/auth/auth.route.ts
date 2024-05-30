import express from "express";
import passport from "passport";
import Container from "typedi";
//import { AuthenMiddWare } from "./auth.middleware";
import { AuthController } from "./auth.controller";
//import jwt from "jsonwebtoken"

const authRoute = express.Router();
//const authMiddleware = Container.get(AuthenMiddWare);
const authController = Container.get(AuthController);

authRoute.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

authRoute.get(
  "/google/callback", passport.authenticate('google', { session: false, failureRedirect: "/api/auth/google"}), authController.checkRegisterByGoogle);

authRoute.get ("/login-google", authController.loginByGoogle)

export default authRoute;
