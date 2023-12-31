import { Service } from "typedi";
import { BodyResquest } from "../../base/base.request";
import { CreateUserRequestDTO } from "./dtos/user-create.dto";
import { NextFunction, Response } from "express";
import { ValidationError, validate } from "class-validator";
import { handleErrorOfValidation } from "../../helpers/handle-errors";
import { UpdateUserDTO } from "./dtos/user-update.dto";
import { UserUpdateEmailOrPassDTO } from "./dtos/user-update-email-pass.dto";
import { UserForgotPassDTO } from "./dtos/user-forgot-pass.dto";

@Service()
export class UserMiddleWare {
  public checkValidationCreateUser = async (
    req: BodyResquest<CreateUserRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const infoUser = CreateUserRequestDTO.fromRequest(req);
      const errors: ValidationError[] = await validate(infoUser);

      if (errors[0]) throw errors;

      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  };

  public checkValidationUpdateUser = async (
    req: BodyResquest<UpdateUserDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = UpdateUserDTO.fromRequest(req);
      const errors: ValidationError[] = await validate(inforUser);

      if (errors[0]) throw errors;

      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  };

  public checkValidationUpdateEmailOrPass = async (
    req: BodyResquest<UserUpdateEmailOrPassDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = UserUpdateEmailOrPassDTO.fromRequest(req);
      const errors: ValidationError[] = await validate(inforUser);

      if (errors[0]) throw errors;

      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  };

  public checkValidationForgotPass = async (
    req: BodyResquest<UserForgotPassDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = UserForgotPassDTO.fromRequest(req);
      const errors: ValidationError[] = await validate(inforUser);

      if (errors[0]) throw errors;

      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  };
}
