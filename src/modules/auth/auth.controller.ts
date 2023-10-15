import { NextFunction, Request, Response } from "express";
import { BodyResquest } from "../../base/base.request";
import { AuthService } from "./auth.service";
import { LoginRequestDTO } from "./dtos/auth-login.dto";
import { ResponseData } from "../../helpers/response";
import { Inject, Service } from "typedi";

@Service()
export class AuthController {
  constructor(@Inject() private authSerivce: AuthService) {
  }

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
