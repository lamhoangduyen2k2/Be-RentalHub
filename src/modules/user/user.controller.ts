import { Inject, Service } from "typedi";
import { UserService } from "./user.service";
import { BodyResquest } from "../../base/base.request";
import { CreateUserRequestDTO } from "./dtos/user-create.dto";
import { NextFunction, Request, Response } from "express";
import { Pagination, ResponseData } from "../../helpers/response";
import { UserHostedDTO } from "./dtos/user-active-host.dto";
import { UpdateUserDTO } from "./dtos/user-update.dto";
import { UserUpdateEmailOrPassDTO } from "./dtos/user-update-email-pass.dto";
import { UpdateInspectorPassDTO } from "./dtos/inspector-update-pass.dto";

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

  public registorUser = async (
    req: BodyResquest<CreateUserRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const infoUser = CreateUserRequestDTO.fromRequest(req);
      const newUser = await this.userService.registorUser(infoUser);

      res.json(new ResponseData(newUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public verifyUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const newUser = await this.userService.verifyRegistor(
        req.body._email,
        req.body.otp
      );

      res.json(new ResponseData(newUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const email = await this.userService.forgotPass(
        req.body._email,
        req.body.url
      );

      res.json(new ResponseData(email, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const email = await this.userService.resetPassword(
        req.params.id,
        req.params.token,
        req.body._pw,
        req.body._pwconfirm
      );

      res.json(new ResponseData(email, null, null));
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

  public getUserList = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagnantion = Pagination.getPagination(req);
      const inforUsers = await this.userService.getUserList(pagnantion);
      res.json(new ResponseData(inforUsers[0], null, inforUsers[1]));
    } catch (error) {
      next(error);
    }
  };

  public getInspectorList = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const inforInspectors = await this.userService.getInspectorList(
        pagination
      );
      res.json(new ResponseData(inforInspectors[0], null, inforInspectors[1]));
    } catch (error) {
      next(error);
    }
  };

  public createInspector = async (
    req: BodyResquest<CreateUserRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const infoUser = CreateUserRequestDTO.fromRequest(req);
      const newInspector = await this.userService.createInspector(infoUser);

      res.json(new ResponseData(newInspector, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public blockInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updatedInspector = await this.userService.blockInspector(
        req.body.inspectId.toString() ?? null
      );
      res.json(new ResponseData(updatedInspector, null, null));
    } catch (error) {
      next(error);
    }
  };

  public getInspectorByIdAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforInspector = await this.userService.getInspectorById(
        req.query.inspectId.toString() ?? null
      );
      res.json(new ResponseData(inforInspector, null, null));
    } catch (error) {
      next(error);
    }
  };

  public updateInspectorPass = async (
    req: BodyResquest<UpdateInspectorPassDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userInfo = UpdateInspectorPassDTO.fromRequest(req);
      const newPass = await this.userService.updatePasswordInspector(userInfo);
      res.json(new ResponseData(newPass, null, null));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  public updateInspectorProfile = async (
    req: BodyResquest<UpdateUserDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforInspector = UpdateUserDTO.fromRequest(req);
      const updatedUser = await this.userService.updateInspectorProfile(
        inforInspector
      );
      res.json(new ResponseData(updatedUser, null, null));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  public updateInspectorAvatar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file as Express.Multer.File;
      const updatedInspector = await this.userService.updateInspectorAvatar(
        file,
        req.body._uId
      );

      res.json(new ResponseData(updatedInspector, null, null));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  public getInspectorById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforInspector = await this.userService.getInspectorById(
        req.body._uId
      );
      res.json(new ResponseData(inforInspector, null, null));
    } catch (error) {
      next(error);
    }
  };
}
