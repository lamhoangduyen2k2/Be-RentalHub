import { Inject, Service } from "typedi";
import { CreateSocialPostDTO } from "./dtos/create-social-post.dto";
import { ImageService } from "../image/image.service";
import SocialPosts from "./social-posts.model";
import { Errors } from "../../helpers/handle-errors";
import { Pagination } from "../../helpers/response";
import mongoose, { PipelineStage } from "mongoose";
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
    pagination: Pagination
  ) => {
    let condition: PipelineStage;
    //Configing condition follows status
    if (status) {
      condition = {
        $match: {
          $and: [
            { _status: status },
            { _uId: new mongoose.Types.ObjectId(uId) },
          ],
        },
      };
    } else {
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
      _status: status,
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
      .skip(pagination.limit)
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
    file: Express.Multer.File
  ) => {
    //Upload image to firebase
    const imgUrl = await this.imageService.uploadSocialImage(file);

    //Create post
    const newPost = await SocialPosts.create({
      ...postInfo,
      _images: imgUrl,
      _uId: new mongoose.Types.ObjectId(userId),
    });
    if (!newPost) throw Errors.SaveToDatabaseFail;

    return newPost;
  };

  //Update social post
  public updateSocialPost = async (
    updatedInfo: UpdateSocialPostDTO,
    file: Express.Multer.File | undefined
  ) => {
    //Check social post is existed
    const socialPost = await SocialPosts.findOne({
      $and: [
        { _id: new mongoose.Types.ObjectId(updatedInfo._id) },
        { _uId: new mongoose.Types.ObjectId(updatedInfo._uId.toString()) },
        { _status: { $ne: 2 } },
      ],
    });
    if (!socialPost) throw Errors.PostNotFound;

    //Update social post
    //Upload image to firebase (if exist)
    if (file)
      socialPost._images = await this.imageService.uploadSocialImage(file);
    console.log(
      "🚀 ~ SocialPostsService ~ updateSocialPost= ~ socialPost._images:",
      socialPost._images
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
      {
        ...socialPost,
        ...updatedInfo,
      },
      { new: true }
    );
    if (!updatedSocialPost) throw Errors.SaveToDatabaseFail;

    return updatedSocialPost;
  };

  //Cancle social post for owner
  public cancleSocialPost = async (postId: string, uId: string) => {
    //Check social post is existed
    const socialPost = await SocialPosts.findOne({
      $and: [
        { _id: new mongoose.Types.ObjectId(postId) },
        { _uId: new mongoose.Types.ObjectId(uId) },
        { _status: { $ne: 2 } },
      ],
    });
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
      { _status: 1 },
      { new: true }
    );
    if (!blockedPost) throw Errors.SaveToDatabaseFail;

    return blockedPost;
  };

  //Report social post
}
