import { Inject, Service } from "typedi";
import { PostsService } from "./posts.service";
import { Request, Response } from "express";

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
}
