import { Inject, Service } from "typedi";
import { SocialPostsService } from "./social-posts.service";
import { NextFunction, Request, Response } from "express";
import { Pagination, ResponseData } from "../../helpers/response";
import { BodyResquest } from "../../base/base.request";
import { CreateSocialPostDTO } from "./dtos/create-social-post.dto";
import { UpdateSocialPostDTO } from "./dtos/update-social-post.dto";
import { startSession } from "mongoose";

@Service()
export class SocialPostsController {
  constructor(@Inject() private socialPostService: SocialPostsService) {}

  //Customer
  //Get all data of social-posts
  public getSocilaPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const status = req.query.status ? Number(req.query.status) : undefined;
      const uId = req.body._uId.toString();
      const paignation = Pagination.getPagination(req);
      const socialPosts = await this.socialPostService.getSocialPosts(
        status,
        uId,
        paignation
      );

      res.json(new ResponseData(socialPosts[0], null, socialPosts[1]));
    } catch (error) {
      console.log(
        "🚀 ~ SocialPostsController ~ getSocilaPosts= ~ error:",
        error
      );
      next(error);
    }
  };

  //Get social post by id
  public getSocialPostById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postId = req.query.postId ? req.query.postId.toString() : undefined;
      const socialPost = await this.socialPostService.getSocialPostById(postId);

      res.json(new ResponseData(socialPost, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ SocialPostsController ~ getSocialPostById= ~ error:",
        error
      );
      next(error);
    }
  };

  //Create social post
  public createSocialPost = async (
    req: BodyResquest<CreateSocialPostDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const createInfo = CreateSocialPostDTO.getFromReuqest(req);
      const uId = req.body._uId.toString();
      const file = req.file as Express.Multer.File;
      session.startTransaction();
      const socialPost = await this.socialPostService.createSocialPost(
        createInfo,
        uId,
        file,
        session
      );

      res.json(new ResponseData(socialPost, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ SocialPostsController ~ createSocialPost= ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };

  //Update social post
  public updateSocialPost = async (
    req: BodyResquest<UpdateSocialPostDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const updateInfo = UpdateSocialPostDTO.getFromReuqest(req);
      const file = req.file ? (req.file as Express.Multer.File) : undefined;
      session.startTransaction();
      const socialPost = await this.socialPostService.updateSocialPost(
        updateInfo,
        file,
        session
      );

      res.json(new ResponseData(socialPost, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ SocialPostsController ~ updateSocialPost= ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };

  //Block social post
  public cancleSocialPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const postId = req.query.postId ? req.query.postId.toString() : undefined;
      const uId = req.body._uId.toString();
      session.startTransaction();
      const result = await this.socialPostService.cancleSocialPost(postId, uId, session);

      res.json(new ResponseData(result, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ SocialPostsController ~ blockSocialPost= ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };
}
