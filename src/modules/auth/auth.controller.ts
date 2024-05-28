import { NextFunction, Request, Response } from "express";
import { BodyResquest } from "../../base/base.request";
import { AuthService } from "./auth.service";
import { LoginRequestDTO } from "./dtos/auth-login.dto";
import { ResponseData } from "../../helpers/response";
import { Inject, Service } from "typedi";
import { LoginGoogleRequestDTO } from "./dtos/login-google";

@Service()
export class AuthController {
  constructor(@Inject() private authSerivce: AuthService) {}

  public loginController = async (
    req: BodyResquest<LoginRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await this.authSerivce.loginService(req.body);

      res.json(new ResponseData(user, null, null));
    } catch (error) {
      next(error);
    }
  };

  // public loginByGoogleController = async (
  //   req: BodyResquest<LoginGoogleRequestDTO>,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const loginInfo = LoginGoogleRequestDTO.fromRequest(req);
  //     const user = await this.authSerivce.loginByGoogle(loginInfo);

  //     res.json(new ResponseData(user, null, null));
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  public checkRegisterByGoogle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = {
        email: req.user["_json"].email,
        given_name: req.user["_json"].given_name,
        family_name: req.user["_json"].family_name,
        picture: req.user["_json"].picture,
        email_verified: req.user["_json"].email_verified,
        type_login: req.user["provider"],
      };
      const userInfo = LoginGoogleRequestDTO.fromRequest(user);
      const token =  await this.authSerivce.checkRegisterByGoogle(userInfo);
      res.cookie('jwt', token, { httpOnly: true, secure: false })
      console.log("🚀 ~ AuthController ~ token:", req.cookies.jwt)
      res.redirect('http://localhost:4200');
    } catch (error) {
      console.log("🚀 ~ AuthController ~ error:", error)
      next(error);
    }
  }

  public loginByGoogle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.cookies.jwt;
      const user = await this.authSerivce.loginByGoogle(token);

      res.json(new ResponseData(user, null, null));
    } catch (error) {
      console.log("🚀 ~ AuthController ~ error:", error)
      next(error);
    }
  }

  public loginInspectorController = async (
    req: BodyResquest<LoginRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await this.authSerivce.loginInspectorService(req.body);

      res.json(new ResponseData(user, null, null));
    } catch (error) {
      next(error);
    }
  };

  public loginAdminController = async (
    req: BodyResquest<LoginRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await this.authSerivce.loginAdminService(req.body);

      res.json(new ResponseData(user, null, null));
    } catch (error) {
      next(error);
    }
  };

  public logoutController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const message = await this.authSerivce.logoutService(
        req.body.userId,
        req.body.refreshToken
      );

      res.json(new ResponseData(message, null, null));
    } catch (error) {
      next(error);
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
