import { Service } from "typedi";
import { BodyResquest } from "../../base/base.request";
import { PostCreateDTO } from "./dtos/post-create.dto";
import { NextFunction, Response } from "express";
import { ValidationError, validate } from "class-validator";
import { handleErrorOfValidation } from "../../helpers/handle-errors";
import { PostUpdateDTO } from "./dtos/post-update.dto";


@Service()
export class PostsMiddleWare {
  public checkValidationCreatePost = async (
    req: BodyResquest<PostCreateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const infoPost = PostCreateDTO.fromRequest(req);
      if (infoPost._tags && !Array.isArray(infoPost._tags)) {
        const tags = infoPost._tags as string
        infoPost._tags = tags.split(',')
      }
      const errors: ValidationError[] = await validate(infoPost);
      if (errors[0]) throw errors;

      next();
    } catch (error) {
      console.log("🚀 ~ PostsMiddleWare ~ error:", error)
      const err = handleErrorOfValidation(error);
      next(err);
    }
  };

  public checkValidationUpdatePost = async (
    req: BodyResquest<PostUpdateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const infoPost = PostUpdateDTO.fromRequest(req);
      if (infoPost._tags && !Array.isArray(infoPost._tags)) {
        const tags = infoPost._tags as string
        infoPost._tags = tags.split(',')
      }
      const errors: ValidationError[] = await validate(infoPost);
      if (errors[0]) throw errors;

      next();
    } catch (error) {
      const err = handleErrorOfValidation(error);
      next(err);
    }
  };
}
