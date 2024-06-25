import { Inject, Service } from "typedi";
import { CreateSocialPostDTO } from "./dtos/create-social-post.dto";
import { ImageService } from "../image/image.service";
import { Errors } from "../../helpers/handle-errors";
import { Pagination } from "../../helpers/response";
import mongoose, { ClientSession, PipelineStage } from "mongoose";
import { convertUTCtoLocal } from "../../helpers/ultil";
import { UpdateSocialPostDTO } from "./dtos/update-social-post.dto";
import SocialPosts from "./models/social-posts.model";
import { ReportSocialPostDTO } from "./dtos/report-social-post.dto";
import { CreateNotificationDTO } from "../notification/dtos/create-notification.dto";
import { NotificationService } from "../notification/notification.service";
import eventEmitter from "../socket/socket";
import ReportedSocialPosts from "./models/social-posts-reported.model";

@Service()
export class SocialPostsService {
  constructor(
    @Inject() private imageService: ImageService,
    @Inject() private notificationService: NotificationService
  ) {}

  //Customer
  //Get all data of social-posts
  public getSocialPosts = async (
    status: number | undefined,
    uId: string | undefined,
    userId: string | undefined,
    pagination: Pagination
  ) => {
    let condition: PipelineStage[];
    //Configing condition follows status
    if (status === 0 && !userId) {
      condition = [
        {
          $match: {
            $and: [
              { $or: [{ _status: 0 }, { _status: 1 }] },
              { _uId: new mongoose.Types.ObjectId(uId) },
            ],
          },
        },
      ];
    } else if (status === 2) {
      condition = [
        {
          $match: {
            $and: [{ _status: 2 }, { _uId: new mongoose.Types.ObjectId(uId) }],
          },
        },
      ];
    } else if (!status && userId) {
      condition = [
        {
          $match: {
            $and: [
              { _status: 0 },
              { _uId: new mongoose.Types.ObjectId(userId) },
            ],
          },
        },
        {
          $addFields: {
            _isLiked: {
              $cond: {
                if: { $in: [new mongoose.Types.ObjectId(uId), "$_uIdLike"] },
                then: true,
                else: false,
              },
            },
          },
        },
      ];
    } else {
      condition = [
        {
          $match: {
            _status: 0,
          },
        },
        {
          $addFields: {
            _isLiked: {
              $cond: {
                if: { $in: [new mongoose.Types.ObjectId(uId), "$_uIdLike"] },
                then: true,
                else: false,
              },
            },
          },
        },
      ];
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
      ...condition,
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
          _totalLike: 1,
          _totalComment: 1,
          _uIdLike: 1,
          _authorId: "$user._id",
          _authorName: {
            $concat: ["$user._fname", " ", "$user._lname"],
          },
          _authorAvatar: "$user._avatar",
          _authorEmail: "$user._email",
          _authorPhone: "$user._phone",
          _isLiked: 1,
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
    console.log("🚀 ~ SocialPostsService ~ updatedInfo:", updatedInfo);
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

  //Report social post
  public reportSocialPost = async (
    reportInfo: ReportSocialPostDTO,
    session: ClientSession
  ) => {
    //Check social post is existed
    const socialPost = await SocialPosts.findOne({
      $and: [{ _id: reportInfo._postId }, { _status: 0 }],
    }).session(session);
    if (!socialPost) throw Errors.PostNotFound;

    //Report social post
    const reportedPost = await ReportedSocialPosts.findOneAndUpdate(
      {
        $and: [{ _postId: reportInfo._postId }, { _isSensored: false }],
      },
      {
        $addToSet: {
          _uId: reportInfo._uId,
          _reason: reportInfo._reason,
        },
        _uIdReported: socialPost._uId,
      },
      { session, new: true, upsert: true }
    );
    if (!reportedPost) throw Errors.SaveToDatabaseFail;

    //Create notification
    const notification = CreateNotificationDTO.fromService({
      _uId: reportInfo._uId,
      _postId: reportedPost._postId,
      _title: "Báo cáo bài viết mạng xã hội",
      _message: `Người dùng mang Id ${reportInfo._uId} đã báo cáo bài viết mang Id ${reportedPost._postId} với nội dung: ${reportInfo._reason}`,
      _type: "NEW_REPORT_SOCIAL_POST",
    });
    const newNotification = await this.notificationService.createNotification(
      notification,
      session
    );
    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

    //Emit event "sendNotification" for internal server
    eventEmitter.emit("sendNotification", {
      ...newNotification[0],
      recipientRole: 2,
    });

    await session.commitTransaction();
    return reportedPost;
  };
}
