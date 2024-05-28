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

// authRoute.get(
//   "/google/callback",
//   authMiddleware.googleCallback,
//   authController.loginByGoogleController
// );

// authRoute.get(
//   "/google/callback", passport.authenticate('google', { session: false}), (req: Request, res: Response) => {
//     const token = jwt.sign({ email: req.user["_json"].email}, process.env.SECRET_KEY, { expiresIn: '1h' })
//     res.cookie('jwt', token, { httpOnly: true, secure: false })
//     res.redirect('http://localhost:4200');
//   });

authRoute.get(
  "/google/callback", passport.authenticate('google', { session: false}), authController.checkRegisterByGoogle);

authRoute.get("/login-google", authController.loginByGoogle)

export default authRoute;
