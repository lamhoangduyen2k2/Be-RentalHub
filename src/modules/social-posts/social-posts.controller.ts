import { Inject, Service } from "typedi";
import { SocialPostsService } from "./social-posts.service";
import { NextFunction, Request, Response } from "express";
import { Pagination, ResponseData } from "../../helpers/response";
import { BodyResquest } from "../../base/base.request";
import { CreateSocialPostDTO } from "./dtos/create-social-post.dto";
import { UpdateSocialPostDTO } from "./dtos/update-social-post.dto";
import { startSession } from "mongoose";
import { ReportSocialPostDTO } from "./dtos/report-social-post.dto";

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
      const userId = req.query.userId ? req.query.userId.toString() : undefined;
      const paignation = Pagination.getPagination(req);
      const socialPosts = await this.socialPostService.getSocialPosts(
        status,
        uId,
        userId,
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

  //Search social post by keyword
  public searchSocialMediaByKeyword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const keyword = req.query.keyword
        ? req.query.keyword.toString()
        : undefined;
      const type = req.query.type ? Number(req.query.type) : undefined;
      const paignation = Pagination.getPagination(req);
      const socialPosts = await this.socialPostService.searchSocialMedia(
        keyword,
        paignation,
        type
      );

      res.json(new ResponseData(socialPosts[0], null, socialPosts[1]));
    } catch (error) {
      console.log(
        "🚀 ~ SocialPostsController ~ searchSocialPost= ~ error:",
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
      const result = await this.socialPostService.cancleSocialPost(
        postId,
        uId,
        session
      );

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

  //Like/Unlike the social post
  public reactSocialPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const postId = req.body.postId ? req.body.postId.toString() : undefined;
      const uId = req.body._uId.toString();
      session.startTransaction();
      const result = await this.socialPostService.reactSocialPost(
        postId,
        uId,
        session
      );

      res.json(new ResponseData(result, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ SocialPostsController ~ likeSocialPost= ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };

  //Report social post
  public reportSocialPost = async (
    req: BodyResquest<ReportSocialPostDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const reportInfo = ReportSocialPostDTO.fromRequest(req);
      session.startTransaction();
      const result = await this.socialPostService.reportSocialPost(
        reportInfo,
        session
      );

      res.json(new ResponseData(result, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ SocialPostsController ~ reportSocialPost= ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };

  //Admin/Inspector
  //Get all social posts by status
  public getdSocialPostsByStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const paignation = Pagination.getPagination(req);
      const status = req.query.status ? Number(req.query.status) : undefined;
      const socialPosts = await this.socialPostService.getSocialPostsByStatus(
        status,
        paignation
      );

      res.json(new ResponseData(socialPosts[0], null, socialPosts[1]));
    } catch (error) {
      console.log(
        "🚀 ~ SocialPostsController ~ getReportedSocialPosts= ~ error:",
        error
      );
      next(error);
    }
  };
  //Get all reported social posts
  public getReportedSocialPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const paignation = Pagination.getPagination(req);
      const socialPosts = await this.socialPostService.getReportedSocialPosts(
        paignation
      );

      res.json(new ResponseData(socialPosts[0], null, socialPosts[1]));
    } catch (error) {
      console.log(
        "🚀 ~ SocialPostsController ~ getReportedSocialPosts= ~ error:",
        error
      );
      next(error);
    }
  };

  //Get reported social-post by id
  public getReportedSocialPostById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const reportedId = req.query.reportedId
        ? req.query.reportedId.toString()
        : undefined;
      const notiId = req.query.notiId ? req.query.notiId.toString() : undefined;
      const socialPost = await this.socialPostService.getReportedSocialPostById(
        reportedId,
        notiId
      );

      res.json(new ResponseData(socialPost, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ SocialPostsController ~ getReportedSocialPostById= ~ error:",
        error
      );
      next(error);
    }
  };

  public sensorReportedSocialPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const inspectorId = req.body._uId.toString();
      const reportedId = req.query.reportedId
        ? req.query.reportedId.toString()
        : undefined;
      const status = req.body.status ? Number(req.body.status) : undefined;
      session.startTransaction();
      const result = await this.socialPostService.sensorReportedSocialPost(
        reportedId,
        inspectorId,
        status,
        session
      );

      res.json(new ResponseData(result, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ SocialPostsController ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  //Admin
  public unBlockSocialPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const postId = req.query.postId ? req.query.postId.toString() : undefined;
      session.startTransaction();
      const result = await this.socialPostService.unBlockSocialPost(
        postId,
        session
      );

      res.json(new ResponseData(result, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ SocialPostsController ~ unBlockSocialPost= ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };
}
