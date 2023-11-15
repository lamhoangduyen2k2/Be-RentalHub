import { Service } from "typedi";
import { BodyResquest } from "../../base/base.request";
import { PostCreateDTO } from "./dtos/post-create.dto";
import { NextFunction, Response } from "express";
import { ValidationError, validate } from "class-validator";
import { handleErrorOfValidation } from "../../helpers/handle-errors";

@Service()
export class PostsMiddleWare {
  public checkValidationCreatePost = async (
    req: BodyResquest<PostCreateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const infoPost = PostCreateDTO.fromRequest(req)
        const errors: ValidationError[] = await validate(infoPost)
        if(errors[0]) throw errors

        next()
    } catch (error) {
        const err = handleErrorOfValidation(error)
        next(err)
    }
  };
}
