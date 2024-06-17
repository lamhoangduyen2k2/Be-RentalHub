import { NextFunction, Response } from "express";
import { Service } from "typedi";
import { CreateCommentDTO } from "./dtos/create-comment.dto";
import { ValidationError, validate } from "class-validator";
import { handleErrorOfValidation } from "../../helpers/handle-errors";
import { BodyResquest } from "../../base/base.request";
import { UpdateCommentDTO } from "./dtos/update-comments.dto";

@Service()
export class CommentsMiddleware {
    //Check validation of create comment
    public checkValidationCreateComment = async (
        req: BodyResquest<CreateCommentDTO>,
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

    //Check validation of update comment
    public checkValidationUpdateComment = async (
        req: BodyResquest<UpdateCommentDTO>,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const updateInfo = UpdateCommentDTO.fromRequest(req);
            const errors: ValidationError[] = await validate(updateInfo);

            if (errors[0]) throw errors;

            next();
        } catch (error) {
            console.log("🚀 ~ CommentsMiddleware ~ error:", error)
            const err = handleErrorOfValidation(error);
            next(err);
        }
    };
}