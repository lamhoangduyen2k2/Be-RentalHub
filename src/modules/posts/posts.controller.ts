import { Inject, Service } from "typedi";
import { PostsService } from "./posts.service";
import { NextFunction, Request, Response } from "express";
import { PostCreateDTO } from "./dtos/post-create.dto";
import { Pagination, ResponseData } from "../../helpers/response";
import { BodyResquest } from "../../base/base.request";
import { PostUpdateDTO } from "./dtos/post-update.dto";
import { PostSensorDTO } from "./dtos/post-sensor.dto";
import { PostUpdateStatusDTO } from "./dtos/post-update-status.dto";
import { ReportCreateDTO } from "./dtos/post-reported.dto";
import { startSession } from "mongoose";
import { PostRequestUpdateDTO } from "./dtos/post-update-request.dto";

@Service()
export class PostsController {
  constructor(@Inject() private postsService: PostsService) {}

  public getAllPostsController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination: Pagination = Pagination.getPagination(req);
      const posts = await this.postsService.getAllPosts(pagination, req.query);
      res.json(new ResponseData(posts[0], null, posts[1]));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public getPostsByStatusController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const status = isNaN(Number(req.query.status))
        ? -1
        : Number(req.query.status);
      const pagination: Pagination = Pagination.getPagination(req);
      const posts = await this.postsService.getPostByStatus(
        pagination,
        status,
        req.body._uId
      );
      res.json(new ResponseData(posts[0], null, posts[1]));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public getPostsByInspectorController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const status = isNaN(Number(req.query.status))
        ? -1
        : Number(req.query.status);
      const pagination: Pagination = Pagination.getPagination(req);
      const posts = await this.postsService.getPostByInspector(
        pagination,
        status
      );
      res.json(new ResponseData(posts[0], null, posts[1]));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public getPostsByStatusInspectorController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const status = isNaN(Number(req.query.status))
        ? -1
        : Number(req.query.status);
      const pagination: Pagination = Pagination.getPagination(req);
      const posts = await this.postsService.getPostByStatusInspecttor(
        pagination,
        status,
        req.body._uId
      );
      res.json(new ResponseData(posts[0], null, posts[1]));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public getPostById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postId = req.query.postId ? req.query.postId.toString() : undefined;
      const notiId = req.query.notiId ? req.query.notiId.toString() : undefined;
      const post = await this.postsService.getPostById(postId, notiId);

      res.json(new ResponseData(post, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:67 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public getPostByIdInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postId = req.query.postId ? req.query.postId.toString() : undefined;
      const notiId = req.query.notiId ? req.query.notiId.toString() : undefined;
      const post = await this.postsService.getPostByIdInspector(postId, notiId);

      res.json(new ResponseData(post, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:67 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public getPostOfUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const uId = req.query.uId ? req.query.uId.toString() : undefined;
      const pagination: Pagination = Pagination.getPagination(req);
      const posts = await this.postsService.getPostOfUser(uId, pagination);

      res.json(new ResponseData(posts[0], null, posts[1]));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:79 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public getPostSimilar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postId = req.query.postId ? req.query.postId.toString() : undefined;
      const pagination: Pagination = Pagination.getPagination(req);
      const posts = await this.postsService.getPostSimilar(postId, pagination);

      res.json(new ResponseData(posts[0], null, posts[1]));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:95 ~ PostsController ~ getPostSimilar= ~ error:",
        error
      );
      next(error);
    }
  };

  public createNewPost = async (
    req: BodyResquest<PostCreateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const files = req.files as Express.Multer.File[];
      const postInfo = PostCreateDTO.fromRequest(req);
      session.startTransaction();
      const post = await this.postsService.createNewPost(postInfo, files, session);

      res.json(new ResponseData(post, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ PostsController ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  public updatePost = async (
    req: BodyResquest<PostUpdateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const files = req.files as Express.Multer.File[];
      const postInfo = PostUpdateDTO.fromRequest(req);
      session.startTransaction();
      const post = await this.postsService.updatePost(
        postInfo,
        req.params.postId,
        files,
        session
      );

      res.json(new ResponseData(post, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ PostsController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public updatePostRequest = async (
    req: BodyResquest<PostRequestUpdateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const files = req.files as Express.Multer.File[];
      const postInfo = PostRequestUpdateDTO.fromRequest(req);
      session.startTransaction();
      const post = await this.postsService.updatePostRequest(
        postInfo,
        req.params.postId,
        files,
        session
      );

      res.json(new ResponseData(post, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ PostsController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public updatePostStatus = async (
    req: BodyResquest<PostUpdateStatusDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const infoStatus = PostUpdateStatusDTO.fromRequest(req);
      session.startTransaction();
      const data = await this.postsService.updatePostStatus(
        infoStatus,
        req.params.postId,
        session
      );

      res.json(new ResponseData(data, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ file: posts.controller.ts:101 ~ PostsController ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };

  public sensorPost = async (
    req: BodyResquest<PostSensorDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const postInfo = PostSensorDTO.fromRequest(req);
      session.startTransaction();
      const post = await this.postsService.sensorPost(
        postInfo,
        req.params.postId,
        session
      );

      res.json(new ResponseData(post, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ PostsController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public searchPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const search = req.query.search
        ? (req.query.search as string)
        : undefined;
      const pagination = Pagination.getPagination(req);
      const posts = await this.postsService.searchPost(search, pagination);

      res.json(new ResponseData(posts[0], null, posts[1]));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public searchPostByTags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const tags = req.query.tags
        ? req.query.tags.toString().split(",")
        : undefined;
      const pagination = Pagination.getPagination(req);
      const posts = await this.postsService.searchPostByTags(tags, pagination);

      res.json(new ResponseData(posts[0], null, posts[1]));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public createFavoritePost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const postId = req.body.postId ? req.body.postId.toString() : undefined;
      session.startTransaction();
      const data = await this.postsService.createFavoritePost(
        req.body._uId,
        postId,
        session
      );

      res.json(new ResponseData(data, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };

  public getFavoritePost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const data = await this.postsService.getFavoritePost(
        req.body._uId,
        pagination
      );

      res.json(new ResponseData(data[0], null, data[1]));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public getArrayFavoritePosts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.postsService.getArrayFavoritePosts(req.body._uId);

      res.json(new ResponseData(data, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public createReportPost = async (
    req: BodyResquest<ReportCreateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const postInfo = ReportCreateDTO.fromRequest(req);
      session.startTransaction();
      const data = await this.postsService.createReportPost(postInfo, session);

      res.json(new ResponseData(data, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };

  public getReportPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const data = await this.postsService.getReportPostsList(pagination);

      res.json(new ResponseData(data[0], null, data[1]));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public searchPostByStatusForHost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const status = isNaN(Number(req.query.status))
        ? -1
        : Number(req.query.status);
      const uId = req.body._uId.toString();
      const postId = req.query.postId ? req.query.postId.toString() : undefined;
      const data = await this.postsService.searchPostByStatusForHost(
        uId,
        postId,
        status
      );

      res.json(new ResponseData(data, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public getReportPostByPostId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postId = req.query.postId ? req.query.postId.toString() : undefined;
      const notiId = req.query.notiId ? req.query.notiId.toString() : undefined;
      const data = await this.postsService.getReportPostById(postId, notiId);

      res.json(new ResponseData(data, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public sensorReportPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      session.startTransaction();
      const status = isNaN(Number(req.body._status)) ? undefined : Number(req.body._status);
      const data = await this.postsService.sensorReportPost(
        req.params.reportedId,
        req.body._uId,
        status,
        session
      );

      res.json(new ResponseData(data, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };

  public getReportedPostByUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notiId = req.query.notiId ? req.query.notiId.toString() : undefined;
      const data = await this.postsService.getReportedPostByUser(notiId);

      res.json(new ResponseData(data, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public getPostsListByAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const status = isNaN(Number(req.query.status))
        ? -1
        : Number(req.query.status);
      const data = await this.postsService.getPostsListByStatusAdmin(
        status,
        pagination
      );

      res.json(new ResponseData(data[0], null, data[1]));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:117 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public getPostByIdAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postId = req.query.postId ? req.query.postId.toString() : undefined;
      const data = await this.postsService.getPostByIdAdmin(postId);

      res.json(new ResponseData(data, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:67 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };

  public getPostByIdOrEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const keyword = req.query.keyword
        ? req.query.keyword.toString()
        : undefined;
      const status = isNaN(Number(req.query.status))
        ? -1
        : Number(req.query.status);
      const pagination = Pagination.getPagination(req);
      const data = await this.postsService.getPostsByIdAndEmail(
        keyword,
        status,
        pagination
      );

      res.json(new ResponseData(data[0], null, data[1]));
    } catch (error) {
      console.log(
        "🚀 ~ file: posts.controller.ts:67 ~ PostsController ~ error:",
        error
      );
      next(error);
    }
  };
}
