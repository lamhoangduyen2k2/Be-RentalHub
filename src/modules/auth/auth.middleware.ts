import { NextFunction, Request, Response } from "express";
import { BodyResquest } from "../../base/base.request";
import { LoginRequestDTO } from "./dtos/auth-login.dto";
import { ValidationError, validate } from "class-validator";
import { Errors, handleErrorOfValidation } from "../../helpers/handle-errors";
import { AuthService } from "./auth.service";
import Users from "../user/model/users.model";
import { Inject, Service } from "typedi";
import passport from "passport";

@Service()
export class AuthenMiddWare {
  constructor(@Inject() private authService: AuthService) {}
  checkValidation = async (
    req: BodyResquest<LoginRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const loginParams = LoginRequestDTO.fromRequest(req);
      const errors: ValidationError[] = await validate(loginParams);

      if (errors[0]) throw errors;

      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  };

  authorized = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.header("Authorization");
      const auth = authHeader?.split(" ")[1];

      if (!auth) throw Errors.Unauthorized;

      const payload = await this.authService.verifyAccessToken(auth);

      //Check role User
      const user = await Users.findOne({ _id: payload.userId });

      if (!user) throw Errors.UserNotFound;

      req.body._uId = payload.userId;

      next();
    } catch (error) {
      next(error);
    }
  };

  authorizedUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.header("Authorization");
      const auth = authHeader?.split(" ")[1];

      if (!auth) throw Errors.Unauthorized;

      const payload = await this.authService.verifyAccessToken(auth);

      //Check role User
      const user = await Users.findOne({ _id: payload.userId });

      if (!user) throw Errors.UserNotFound;

      if (user._role !== 0 || !user._active) throw Errors.Unauthorized;

      req.body._uId = payload.userId;

      next();
    } catch (error) {
      next(error);
    }
  };

  authorizedAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.header("Authorization");
      const auth = authHeader?.split(" ")[1];
      
      if (!auth) throw Errors.Unauthorized;
      
      const payload = await this.authService.verifyAccessToken(auth);

      //Check role User
      const user = await Users.findOne({ _id: payload.userId });

      if (!user) throw Errors.UserNotFound;

      if (user._role !== 1) throw Errors.Unauthorized;

      req.body._uId = payload.userId;

      next();
    } catch (error) {
      next(error);
    }
  };

  authorizedInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authHeader = req.header("Authorization");
      const auth = authHeader?.split(" ")[1];

      if (!auth) throw Errors.Unauthorized;

      const payload = await this.authService.verifyAccessToken(auth);

      //Check role User
      const user = await Users.findOne({ _id: payload.userId });

      if (!user) throw Errors.UserNotFound;

      if (user._role === 0) throw Errors.Unauthorized;

      req.body._uId = payload.userId;

      next();
    } catch (error) {
      next(error);
    }
  };

  checkResetToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.body.refreshToken;

      const payload = await this.authService.verifyRefreshToken(refreshToken);
      req.body.userId = payload.userId;
      req.body.expToken = payload.timeExpireRefresh;
      next();
    } catch (error) {
      next(error);
    }
  };

  googleCallback = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", (err, profile) => {
      const user = {
        email: profile._json.email,
        given_name: profile._json.given_name,
        family_name: profile._json.family_name,
        picture: profile._json.picture,
        email_verified: profile._json.email_verified,
        type_login: profile.provider,
      };
      req.body = user;
      next();
    })(req, res, next);
  }
}
