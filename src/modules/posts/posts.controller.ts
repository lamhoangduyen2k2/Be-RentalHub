import { Inject, Service } from "typedi";
import { PostsService } from "./posts.service";
import { NextFunction, Request, Response } from "express";
import { PostCreateDTO } from "./dtos/post-create.dto";
import { ResponseData } from "../../helpers/response";
import { BodyResquest } from "../../base/base.request";
import { PostUpdateDTO } from "./dtos/post-update.dto";


@Service()
export class PostsController {
  constructor(@Inject() private postsService: PostsService) {}

  public getAllPostsController = async (req: Request, res: Response) => {
    try {
      const posts = await this.postsService.getAllPosts();
      res.status(200).json({
        msg: "Lấy thành công các posts",
        data: posts,
      });
    } catch (error) {
      res.status(400).json({
        msg: "Không lấy được các posts",
      });
    }
  };

  public createNewPost = async (
    req: BodyResquest<PostCreateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postInfo = PostCreateDTO.fromRequest(req);
      const post = await this.postsService.createNewPost(postInfo);

      res.json(new ResponseData(post, null, null));
    } catch (error) {
      console.log(error)
      next(error)
    }
  };

  public updatePost = async (
    req: BodyResquest<PostUpdateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postInfo = PostUpdateDTO.fromRequest(req);
      const post = await this.postsService.updatePost(postInfo, req.params.postId);

      res.json(new ResponseData(post, null, null));
    } catch (error) {
      console.log(error)
      next(error)
    }
  };

  public sensorPost = async (
    req: BodyResquest<PostUpdateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postInfo = PostUpdateDTO.fromRequest(req);
      const post = await this.postsService.sensorPost(postInfo, req.params.postId);

      res.json(new ResponseData(post, null, null));
    } catch (error) {
      console.log(error)
      next(error)
    }
  };
}
