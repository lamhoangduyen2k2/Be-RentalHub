import { Inject, Service } from "typedi";
import { ReactionService } from "./reaction.service";
import { NextFunction, Request, Response } from "express";
import { ResponseData } from "../../helpers/response";

@Service()
export class ReactionController {
  constructor(@Inject() private reactionService: ReactionService) {}

  //Customer
  //React social post
  public reactSocialPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const postId = req.body.postId.toString();
      const userId = req.body._uId.toString();
      const socialPost = await this.reactionService.reactSocialPost(
        userId,
        postId
      );
      
      return res.json(new ResponseData(socialPost, null, null));
    } catch (error) {
      console.log("🚀 ~ ReactionController ~ error:", error)
      next(error);
    }
  };
}
