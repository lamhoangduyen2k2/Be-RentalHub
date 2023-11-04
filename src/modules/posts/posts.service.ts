import { Service } from "typedi";
import Posts from "./posts.model";
import { PostCreateDTO } from "./dtos/post-create.dto";
import { Errors } from "../../helpers/handle-errors";
import { PostUpdateDTO } from "./dtos/post-update.dto";
import Users from "../user/users.model";
import { Pagination } from "../../helpers/response";

@Service()
export class PostsService {
  public createNewPost = async (postParam: PostCreateDTO) => {
    const user = await Users.findOne({
      $and: [{ _id: postParam._uId }, { _isHost: true }],
    });

    if (!user) throw Errors.UserNotFound;

    const newPosts = await Posts.create(postParam);

    if (!newPosts) throw Errors.SaveToDatabaseFail;

    return newPosts;
  };

  public updatePost = async (postParam: PostUpdateDTO, postId: string) => {
    const post = await Posts.findOne({
      $and: [{ _id: postId }, { _uId: postParam._uId }, { _active: true }],
    });

    if (!post) throw Errors.PostNotFound;

    const updatedPost = await Posts.updateOne({ _id: postId }, postParam);

    if (updatedPost.matchedCount <= 0) throw Errors.SaveToDatabaseFail;

    return true;
  };

  public sensorPost = async (postParam: PostUpdateDTO, postId: string) => {
    await Posts.findById(postId).catch(() => {
      throw Errors.PostNotFound;
    });

    if (postParam._status === 2 || postParam._status === 3) {
      postParam._active = false;
    }

    const updatedPost = await Posts.updateOne(
      { _id: postId },
      {
        _status: postParam._status,
        _active: postParam._active,
        _inspectId: postParam._uId,
      }
    );

    if (updatedPost.matchedCount <= 0) throw Errors.SaveToDatabaseFail;

    return true;
  };

  public getAllPosts = async (pagination: Pagination) => {
    const count = await Posts.countDocuments({})
    const posts = await Posts.find({})
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (!posts[0]?._id) throw Errors.PageNotFound

      return [
        posts,
        { page: pagination.page, limit: pagination.limit, total: count },
      ];
  };
}
