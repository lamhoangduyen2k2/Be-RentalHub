import { Inject, Service } from "typedi";
import { UserService } from "./user.service";
import { BodyResquest } from "../../base/base.request";
import { CreateUserRequestDTO } from "./dtos/user-create.dto";
import { NextFunction, Request, Response } from "express";
import { ResponseData } from "../../helpers/response";
import { UserHostedDTO } from "./dtos/user-active-host.dto";
import { UpdateUserDTO } from "./dtos/user-update.dto";
import { UserUpdateEmailOrPassDTO } from "./dtos/user-update-email-pass.dto";

@Service()
export class UserController {
  constructor(@Inject() private userService: UserService) {}

  public registor = async (
    req: BodyResquest<CreateUserRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const infoUser = CreateUserRequestDTO.fromRequest(req);
      const newUser = await this.userService.createNewUser(infoUser);

      res.json(new ResponseData(newUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public updateUserProfile = async (
    req: BodyResquest<UpdateUserDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = UpdateUserDTO.fromRequest(req);
      const updatedUser = await this.userService.updateUser(inforUser);

      res.json(new ResponseData(updatedUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public updateUserAvatar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file as Express.Multer.File;
      const updatedUser = await this.userService.updateAvatar(
        file,
        req.body._uId
      );

      res.json(new ResponseData(updatedUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public updateEmailOrPass = async (
    req: BodyResquest<UserUpdateEmailOrPassDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userInfo = UserUpdateEmailOrPassDTO.fromRequest(req);
      const newEmail = await this.userService.updateEmail(userInfo);

      res.json(new ResponseData(newEmail, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ file: user.controller.ts:77 ~ UserController ~ error:",
        error
      );
      next(error);
    }
  };

  public activeHost = async (
    req: BodyResquest<UserHostedDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userInfo = UserHostedDTO.fromRequest(req);
      const newUser = await this.userService.activeHost(userInfo);
      res.json(new ResponseData(newUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public verifyHost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updatedUser = await this.userService.verifyHost(
        req.body._uId,
        req.body.otp
      );
      res.json(new ResponseData(updatedUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public resetOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newUser = await this.userService.resetOTP(req.body._uId);
      res.json(new ResponseData(newUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = await this.userService.getUserById(
        req.query.uId.toString()
      );
      res.json(new ResponseData(inforUser, null, null));
    } catch (error) {
      next(error);
    }
  };
}
