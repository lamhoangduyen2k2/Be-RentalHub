import { Service } from "typedi";
import SocialPosts from "../social-posts/social-posts.model";
import mongoose from "mongoose";
import { Errors } from "../../helpers/handle-errors";
import Reaction from "./reaction.model";

@Service()
export class ReactionService {
  constructor() {}

  //Customer
  public reactSocialPost = async (uId: string, postId: string) => {
    //find social post
    const socialPost = await SocialPosts.findOne({
      $and: [{ _id: new mongoose.Types.ObjectId(postId) }, { _status: 0 }],
    });
    if (!socialPost) throw Errors.PostNotFound;

    //Find the reaction of user
    const reaction = await Reaction.findOne({
        $and: [
            { _uId: new mongoose.Types.ObjectId(uId) },
            { _postId: new mongoose.Types.ObjectId(postId) },
        ],
    })

    //reaction social post
    const newReaction = await Reaction.findOneAndUpdate({
        $and: [
            { _uId: new mongoose.Types.ObjectId(uId) },
            { _postId: new mongoose.Types.ObjectId(postId) },
            ],
    }, {
        _like: reaction ? !reaction._like : true,
    }, { new: true, upsert: true });

    //update total like of social post
    // const updatedSocialPost = await SocialPosts.findOneAndUpdate()
  };
}
