import { Service } from "typedi";
import { BodyResquest } from "../../base/base.request";
import { CreateUserRequestDTO } from "./dtos/user-create.dto";
import { NextFunction, Response } from "express";
import { ValidationError, validate } from "class-validator";
import { handleErrorOfValidation } from "../../helpers/handle-errors";
import { UpdateUserDTO } from "./dtos/user-update.dto";
import { UserUpdateEmailOrPassDTO } from "./dtos/user-update-email-pass.dto";
import { UserForgotPassDTO } from "./dtos/user-forgot-pass.dto";
import { UpdateInspectorPassDTO } from "./dtos/inspector-update-pass.dto";
import { UpdateInspectorPasswordDTO } from "./dtos/update-password-inspector.dto";
import { SensorIdenityDTO } from "./dtos/sensor-identity.dto";

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

  public checkValidationUpdatePassInspector = async (
    req: BodyResquest<UpdateInspectorPassDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforInspector = UpdateInspectorPassDTO.fromRequest(req);
      const errors: ValidationError[] = await validate(inforInspector);

      if (errors[0]) throw errors;

      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  };

  public checkValidationUpdatePassowdInspector = async (
    req: BodyResquest<UpdateInspectorPasswordDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforInspector = UpdateInspectorPasswordDTO.fromRequest(req);
      const errors: ValidationError[] = await validate(inforInspector);

      if (errors[0]) throw errors;

      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  }

  public checkValidationSensor = async (
    req: BodyResquest<SensorIdenityDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforSensor = SensorIdenityDTO.fromRequest(req);
      const errors: ValidationError[] = await validate(inforSensor);

      if (errors[0]) throw errors;

      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  }


}
