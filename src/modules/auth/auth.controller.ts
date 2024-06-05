import { NextFunction, Request, Response } from "express";
import { BodyResquest } from "../../base/base.request";
import { AuthService } from "./auth.service";
import { LoginRequestDTO } from "./dtos/auth-login.dto";
import { ResponseData } from "../../helpers/response";
import { Inject, Service } from "typedi";
import { LoginGoogleRequestDTO } from "./dtos/login-google";
import { startSession } from "mongoose";

@Service()
export class AuthController {
  constructor(@Inject() private authSerivce: AuthService) {}

  public loginController = async (
    req: BodyResquest<LoginRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      session.startTransaction();
      const user = await this.authSerivce.loginService(req.body, session);

      res.json(new ResponseData(user, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ AuthController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public checkRegisterByGoogle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const user = {
        email: req.user["_json"].email,
        given_name: req.user["_json"].given_name,
        family_name: req.user["_json"].family_name,
        picture: req.user["_json"].picture,
        email_verified: req.user["_json"].email_verified,
        type_login: req.user["provider"],
      };
      console.log("🚀 ~ AuthController ~ user:", user)
      const userInfo = LoginGoogleRequestDTO.fromRequest(user);
      session.startTransaction();
      const token =  await this.authSerivce.checkRegisterByGoogle(userInfo, session);
      console.log("🚀 ~ AuthController ~ token:", token)
      res.cookie('jwt', token, { httpOnly: true, secure: false })
      res.redirect('http://localhost:4200');
    } catch (error) {
       await session.abortTransaction();
      console.log("🚀 ~ AuthController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  }

  public loginByGoogle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const token = await req.cookies.jwt;
      console.log("🚀 ~ AuthController.loginByGoogle ~ token:", token)
      session.startTransaction();
      const user = await this.authSerivce.loginByGoogle(token, session);
      console.log("🚀 ~ AuthController.loginByGoogle ~ user:", user)

      res.json(new ResponseData(user, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ AuthController ~ error:", error)
      next(error);
    } 
    finally {
      session.endSession();
    }
  }

  public loginInspectorController = async (
    req: BodyResquest<LoginRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      session.startTransaction();
      const user = await this.authSerivce.loginInspectorService(req.body, session);

      res.json(new ResponseData(user, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ AuthController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public loginAdminController = async (
    req: BodyResquest<LoginRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      session.startTransaction();
      const user = await this.authSerivce.loginAdminService(req.body, session);

      res.json(new ResponseData(user, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ AuthController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public logoutController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      session.startTransaction();
      const message = await this.authSerivce.logoutService(
        req.body.userId,
        req.body.refreshToken,
        session
      );

      res.json(new ResponseData(message, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ AuthController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public resetTokenController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = await this.authSerivce.resetToken(
        req.body.userId,
        req.body.refreshToken
      );

      res.json(new ResponseData(token, null, null));
    } catch (error) {
      next(error);
    }
  };
}
