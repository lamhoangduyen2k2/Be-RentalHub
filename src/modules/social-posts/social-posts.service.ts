import { Inject, Service } from "typedi";
import { CreateSocialPostDTO } from "./dtos/create-social-post.dto";
import { ImageService } from "../image/image.service";
import SocialPosts from "./social-posts.model";
import { Errors } from "../../helpers/handle-errors";
import { Pagination } from "../../helpers/response";
import mongoose, { ClientSession, PipelineStage } from "mongoose";
import { convertUTCtoLocal } from "../../helpers/ultil";
import { UpdateSocialPostDTO } from "./dtos/update-social-post.dto";

@Service()
export class SocialPostsService {
  constructor(@Inject() private imageService: ImageService) {}

  //Customer
  //Get all data of social-posts
  public getSocialPosts = async (
    status: number | undefined,
    uId: string | undefined,
    userId: string | undefined,
    pagination: Pagination
  ) => {
    let condition: PipelineStage;
    //Configing condition follows status
    if (status === 0 && !userId) {
      condition = {
        $match: {
          $and: [
            { $or: [{ _status: 0 }, { _status: 1 }] },
            { _uId: new mongoose.Types.ObjectId(uId) },
          ],
        },
      };
    } else if (status === 2 ) {
      condition = {
        $match: {
          $and: [
            { _status: 2 },
            { _uId: new mongoose.Types.ObjectId(uId) },
          ],
        },
      };
    }
    else if (status === 0 && userId) {
      condition = {
        $match: {
          $and: [
            { _status: 0 },
            { _uId: new mongoose.Types.ObjectId(userId) },
          ],
        },
      };
    } 
    else {
      condition = {
        $match: {
          _status: 0,
        },
      };
    }
    console.log(
      "🚀 ~ SocialPostsService ~ getSocialPosts= ~ condition:",
      condition
    );
    //Count total social posts
    const totalSocialPosts = await SocialPosts.countDocuments({
      _status: status | 0,
    });

    //Calculate total pages
    const totalPages = Math.ceil(totalSocialPosts / pagination.limit);
    if (totalPages === 0) throw Errors.PostNotFound;
    if (pagination.page > totalPages) throw Errors.PageNotFound;

    //Get all social posts
    const socialPosts = await SocialPosts.aggregate([
      condition,
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          _title: 1,
          _content: 1,
          _images: 1,
          _status: 1,
          _inspectId: 1,
          _reason: 1,
          _authorId: "$user._id",
          _authorName: {
            $concat: ["$user._fname", " ", "$user._lname"],
          },
          _authorAvatar: "$user._avatar",
          _authorEmail: "$user._email",
          _authorPhone: "$user._phone",
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ])
      .skip(pagination.offset)
      .limit(pagination.limit);
    if (socialPosts.length <= 0) throw Errors.PostNotFound;

    //Convert UTC time to Local time
    socialPosts.forEach((post) => {
      post._postingDateLocal = convertUTCtoLocal(post.updatedAt);
    });

    return [
      socialPosts,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  //Get social post by id
  public getSocialPostById = async (postId: string) => {
    //Get social post
    const socialPost = await SocialPosts.findOne({
      _id: new mongoose.Types.ObjectId(postId),
    });
    if (!socialPost) throw Errors.PostNotFound;

    return socialPost;
  };

  //Create new social post
  public createSocialPost = async (
    postInfo: CreateSocialPostDTO,
    userId: string,
    file: Express.Multer.File,
    session: ClientSession
  ) => {
    //Upload image to firebase
    const imgUrl = await this.imageService.uploadSocialImage(file);

    //Create post
    const newPost = await SocialPosts.create(
      [
        {
          ...postInfo,
          _images: imgUrl,
          _uId: new mongoose.Types.ObjectId(userId),
        },
      ],
      { session }
    );
    if (newPost.length <= 0) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return newPost[0];
  };

  //Update social post
  public updateSocialPost = async (
    updatedInfo: UpdateSocialPostDTO,
    file: Express.Multer.File | undefined,
    session: ClientSession
  ) => {
    console.log("🚀 ~ SocialPostsService ~ updatedInfo:", updatedInfo)
    //Check social post is existed
    const socialPost = await SocialPosts.findOne({
      $and: [
        { _id: new mongoose.Types.ObjectId(updatedInfo._id) },
        { _uId: new mongoose.Types.ObjectId(updatedInfo._uId.toString()) },
        { _status: { $ne: 2 } },
      ],
    }).session(session);
    if (!socialPost) throw Errors.PostNotFound;

    //Update social post
    //Upload image to firebase (if exist)
    if (file)
      updatedInfo._images = await this.imageService.uploadSocialImage(file);
    console.log(
      "🚀 ~ SocialPostsService ~ updateSocialPost= ~ socialPost._images:",
      updatedInfo._images
    );

    //Update social post
    const updatedSocialPost = await SocialPosts.findOneAndUpdate(
      {
        $and: [
          { _id: new mongoose.Types.ObjectId(updatedInfo._id) },
          { _uId: new mongoose.Types.ObjectId(updatedInfo._uId.toString()) },
          { _status: { $ne: 2 } },
        ],
      },
      updatedInfo,
      { session, new: true }
    );
    if (!updatedSocialPost) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return updatedSocialPost;
  };

  //Cancle social post for owner
  public cancleSocialPost = async (
    postId: string,
    uId: string,
    session: ClientSession
  ) => {
    //Check social post is existed
    const socialPost = await SocialPosts.findOne({
      $and: [
        { _id: new mongoose.Types.ObjectId(postId) },
        { _uId: new mongoose.Types.ObjectId(uId) },
        { _status: { $ne: 2 } },
      ],
    }).session(session);
    if (!socialPost) throw Errors.PostNotFound;

    //Block social post
    const blockedPost = await SocialPosts.findOneAndUpdate(
      {
        $and: [
          { _id: new mongoose.Types.ObjectId(postId) },
          { _uId: new mongoose.Types.ObjectId(uId) },
          { _status: { $ne: 2 } },
        ],
      },
      { _status: socialPost._status === 0 ? 1 : 0 },
      { session, new: true }
    );
    if (!blockedPost) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return true;
  };

  //Like/Unlike social post
  public reactSocialPost = async (
    postId: string,
    uId: string,
    session: ClientSession
  ) => {
    //Check social post is existed
    const socialPost = await SocialPosts.findOne({
      $and: [{ _id: new mongoose.Types.ObjectId(postId) }, { _status: 0 }],
    }).session(session);
    if (!socialPost) throw Errors.PostNotFound;

    //Check user liked this post
    const isLiked = socialPost._uIdLike.includes(
      new mongoose.Types.ObjectId(uId)
    );
    if (isLiked) {
      //Unlike social post
      socialPost._uIdLike.splice(
        socialPost._uIdLike.indexOf(new mongoose.Types.ObjectId(uId)),
        1
      );
      socialPost._totalLike =
        socialPost._totalLike === 0 ? 0 : Number(socialPost?._totalLike) - 1;
    } else {
      socialPost._uIdLike.push(new mongoose.Types.ObjectId(uId));
      socialPost._totalLike = Number(socialPost._totalLike) + 1;
    }
    //Update Like/unliked social post
    const updatedPost = await SocialPosts.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(postId) },
      { _totalLike: socialPost._totalLike, _uIdLike: socialPost._uIdLike },
      { session, new: true }
    );
    if (!updatedPost) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return updatedPost;
  };
}
