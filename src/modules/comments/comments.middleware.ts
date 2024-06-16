import { NextFunction, Request, Response } from "express";
import { Service } from "typedi";
import { CreateCommentDTO } from "./dtos/create-comment.dto";
import { ValidationError, validate } from "class-validator";
import { handleErrorOfValidation } from "../../helpers/handle-errors";

@Service()
export class CommentsMiddleware {
    //Check validation of create comment
    public checkValidationCreateComment = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const createInfo = CreateCommentDTO.fromRequest(req);
            const errors: ValidationError[] = await validate(createInfo);

            if (errors[0]) throw errors;

            next();
        } catch (error) {
            console.log("🚀 ~ CommentsMiddleware ~ error:", error)
            const err = handleErrorOfValidation(error);
            next(err);
        }
    };
}