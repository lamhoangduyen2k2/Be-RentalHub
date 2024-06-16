import { Inject, Service } from "typedi";
import { CommentsService } from "./comments.service";
import { BodyResquest } from "../../base/base.request";
import { CreateCommentDTO } from "./dtos/create-comment.dto";
import { NextFunction, Response } from "express";
import { startSession } from "mongoose";
import { ResponseData } from "../../helpers/response";

@Service()
export class CommentsController {
    constructor(@Inject() private commentsService: CommentsService) {}

    //Create comment
    public createComments = async (req: BodyResquest<CreateCommentDTO>, res: Response, next: NextFunction) => {
        const session = await startSession();
        try {
            const comment = CreateCommentDTO.fromRequest(req);
            session.startTransaction();
            const newComment = await this.commentsService.createComment(comment, session);

            res.json(new ResponseData(newComment, null, null));
        } catch (error) {
            await session.abortTransaction();
            console.log("🚀 ~ CommentsController ~ createComments= ~ error:", error)
            next(error);
        } finally {
            session.endSession();
        }
    }
}