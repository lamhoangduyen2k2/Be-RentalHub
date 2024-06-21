import { Service } from "typedi";
import { BodyResquest } from "../../base/base.request";
import { CreateSocialPostDTO } from "./dtos/create-social-post.dto";
import { NextFunction, Request, Response } from "express";
import { ValidationError, validate } from "class-validator";
import { handleErrorOfValidation } from "../../helpers/handle-errors";
import { UpdateSocialPostDTO } from "./dtos/update-social-post.dto";

@Service()
export class SocialPostMiddleware {
  public checkValidationCreateSocialPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const createInfo = CreateSocialPostDTO.getFromReuqest(req);
      console.log("🚀 ~ SocialPostMiddleware ~ createInfo:", req.body)
      
      const errors: ValidationError[] = await validate(createInfo);

      if (errors[0]) throw errors;
      
      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  };

  public checkValidationUpdateSocialPost = async (
    req: BodyResquest<UpdateSocialPostDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updateInfo = UpdateSocialPostDTO.getFromReuqest(req);
      const errors: ValidationError[] = await validate(updateInfo);

      if (errors[0]) throw errors;

      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  };
}
