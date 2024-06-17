import { Inject, Service } from "typedi";
import { CommentsService } from "./comments.service";
import { BodyResquest } from "../../base/base.request";
import { CreateCommentDTO } from "./dtos/create-comment.dto";
import { NextFunction, Request, Response } from "express";
import { startSession } from "mongoose";
import { ResponseData } from "../../helpers/response";
import { UpdateCommentDTO } from "./dtos/update-comments.dto";

@Service()
export class CommentsController {
  constructor(@Inject() private commentsService: CommentsService) {}

  //Create comment
  public createComments = async (
    req: BodyResquest<CreateCommentDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const comment = CreateCommentDTO.fromRequest(req);
      const files = req.files as Express.Multer.File[];
      session.startTransaction();
      const newComment = await this.commentsService.createComment(
        comment,
        files,
        session
      );

      res.json(new ResponseData(newComment, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ CommentsController ~ createComments= ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  //Update comment
  public updateComments = async (
    req: BodyResquest<UpdateCommentDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const commentId = req.query.commentId.toString();
      const commentInfo = UpdateCommentDTO.fromRequest(req);
      const files = req.files
        ? (req.files as Express.Multer.File[])
        : undefined;
      session.startTransaction();
      const commentUpdated = await this.commentsService.updateComment(
        commentId,
        commentInfo,
        files,
        session
      );

      res.json(new ResponseData(commentUpdated, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ CommentsController ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  //Hide comment
  public hideComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const commentId = req.query.commentId.toString();
      const uId = req.body._uId;
      session.startTransaction();
      const comment = await this.commentsService.hideComment(
        commentId,
        uId,
        session
      );

      res.json(new ResponseData(comment, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ CommentsController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  }
}
