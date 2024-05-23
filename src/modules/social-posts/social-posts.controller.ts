import { Inject, Service } from "typedi";
import { SocialPostsService } from "./social-posts.service";
import { NextFunction, Request, Response } from "express";
import { Pagination, ResponseData } from "../../helpers/response";
import { BodyResquest } from "../../base/base.request";
import { CreateSocialPostDTO } from "./dtos/create-social-post.dto";
import { UpdateSocialPostDTO } from "./dtos/update-social-post.dto";

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
      return res.json(new ResponseData(socialPosts[0], null, socialPosts[1]));
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
      return res.json(new ResponseData(socialPost, null, null));
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
    try {
      const createInfo = CreateSocialPostDTO.getFromReuqest(req);
      const uId = req.body._uId.toString();
      const file = req.file as Express.Multer.File;
      const socialPost = await this.socialPostService.createSocialPost(
        createInfo,
        uId,
        file
      );
      return res.json(new ResponseData(socialPost, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ SocialPostsController ~ createSocialPost= ~ error:",
        error
      );
      next(error);
    }
  };

  //Update social post
  public updateSocialPost = async (
    req: BodyResquest<UpdateSocialPostDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updateInfo = UpdateSocialPostDTO.getFromReuqest(req);
      const file = req.file ? (req.file as Express.Multer.File) : undefined;
      const socialPost = await this.socialPostService.updateSocialPost(
        updateInfo,
        file
      );
      return res.json(new ResponseData(socialPost, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ SocialPostsController ~ updateSocialPost= ~ error:",
        error
      );
      next(error);
    }
  };

  //Block social post
  public cancleSocialPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postId = req.query.postId ? req.query.postId.toString() : undefined;
      const uId = req.body._uId.toString();
      await this.socialPostService.cancleSocialPost(postId, uId);
      return res.json(new ResponseData(null, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ SocialPostsController ~ blockSocialPost= ~ error:",
        error
      );
      next(error);
    }
  };
}
