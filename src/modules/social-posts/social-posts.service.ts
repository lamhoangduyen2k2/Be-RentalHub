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
import Users from "../user/model/users.model";
import { UserService } from "../user/user.service";
import { SendMailDTO } from "../user/dtos/user-create.dto";
import { OTPService } from "../otp/otp.service";

@Service()
export class SocialPostsService {
  constructor(
    @Inject() private imageService: ImageService,
    @Inject() private notificationService: NotificationService,
    @Inject() private userService: UserService,
    @Inject() private otpService: OTPService
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
  public getSocialPostById = async (
    postId: string,
    uId: string,
    notiId: string | undefined
  ) => {
    if (notiId) this.notificationService.getNotificationById(notiId);

    //Get social post
    const socialPost = await SocialPosts.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(postId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
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
    ]);
    if (socialPost.length <= 0) throw Errors.PostNotFound;

    return socialPost[0];
  };

  //Search social post by keyword
  public searchSocialMedia = async (
    keyword: string,
    pagination: Pagination,
    type: number,
    uId: string
  ) => {
    let socialResult = [];
    let totalPages = 0;
    let totalSocialResult = 0;
    //Count total social posts by keyword
    if (type === 0) {
      totalSocialResult = await SocialPosts.countDocuments({
        $and: [
          {
            $text: { $search: keyword },
          },
          { _status: 0 },
        ],
      });
      if (totalSocialResult <= 0) throw Errors.PostNotFound;

      //Calculate total pages
      totalPages = Math.ceil(totalSocialResult / pagination.limit);
      if (pagination.page > totalPages) throw Errors.PageNotFound;

      //Search social post
      socialResult = await SocialPosts.aggregate([
        {
          $match: {
            $and: [
              {
                $text: { $search: keyword },
              },
              { _status: 0 },
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
      if (socialResult.length <= 0) throw Errors.PostNotFound;
    } else {
      //Count user by keyword
      totalSocialResult = await Users.countDocuments({
        $and: [
          {
            $text: { $search: keyword },
          },
          { _role: 0 },
          { _active: true },
        ],
      });
      if (totalSocialResult <= 0) throw Errors.UserNotFound;

      //Calculate total pages
      totalPages = Math.ceil(totalSocialResult / pagination.limit);
      if (pagination.page > totalPages) throw Errors.PageNotFound;

      //Search user by keyword
      socialResult = await Users.aggregate([
        {
          $match: {
            $and: [
              {
                $text: { $search: keyword },
              },
              { _role: 0 },
              { _active: true },
            ],
          },
        },
        {
          $lookup: {
            from: "social-posts",
            localField: "_id",
            foreignField: "_uId",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_status", 0],
                  },
                },
              },
            ],
            as: "socialPost",
          },
        },
        {
          $addFields: {
            _totalSocialPost: {
              $size: "$socialPost",
            },
          },
        },
        {
          $project: {
            _id: 1,
            _name: { $concat: ["$_fname", " ", "$_lname"] },
            _email: 1,
            _phone: 1,
            _avatar: 1,
            _totalReported: 1,
            _addressRental: 1,
            _totalSocialPost: 1,
            _rating: 1,
            _role: 1,
            _createdAt: 1,
          },
        },
      ])
        .skip(pagination.offset)
        .limit(pagination.limit);
      if (socialResult.length <= 0) throw Errors.UserNotFound;
    }

    return [
      socialResult,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
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

  //Admin/Inspector
  //Get all social posts by status
  public getSocialPostsByStatus = async (
    status: number | undefined,
    pagination: Pagination
  ) => {
    let count = 0;

    //Config pipeline stage
    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $lookup: {
          from: "reported-social-posts",
          localField: "_id",
          foreignField: "_postId",
          let: { status_post: "$_status" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_isSensored", true] },
                    { $eq: ["$$status_post", 2] },
                  ],
                },
              },
            },
          ],
          as: "reportedPost",
        },
      },
      {
        $unwind: {
          preserveNullAndEmptyArrays: true,
          path: "$reportedPost",
        },
      },
      {
        $addFields: {
          _uRequest: {
            $cond: {
              if: "$reportedPost._uId",
              then: { $size: "$reportedPost._uId" },
              else: 0,
            },
          },
        },
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
          _uId: 1,
          _auName: { $concat: ["$author._fname", " ", "$author._lname"] },
          _auEmail: "$author._email",
          _auAvatar: "$author._avatar",
          _uRequest: 1,
          _createdAt: 1,
        },
      },
    ];
    //Check condition by status
    if (!isNaN(status)) {
      pipeline.unshift({
        $match: {
          _status: status,
        },
      });

      count = await SocialPosts.countDocuments({
        _status: status,
      });
    } else {
      count = await SocialPosts.countDocuments();
    }

    if (count <= 0) throw Errors.PostNotFound;
    // //Count total social posts
    // const totalSocialPosts = await SocialPosts.countDocuments({
    //   _status: status,
    // });
    // if (totalSocialPosts <= 0) throw Errors.PostNotFound;

    //Calculate total pages
    const totalPages = Math.ceil(count / pagination.limit);
    if (pagination.page > totalPages) throw Errors.PageNotFound;

    //Get all social posts
    const socialPosts = await SocialPosts.aggregate(pipeline)
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (socialPosts.length <= 0) throw Errors.PageNotFound;

    //Convert UTC time to Local time
    socialPosts.forEach((post) => {
      post._createdAtLocal = convertUTCtoLocal(post._createdAt);
      delete post._createdAt;
    });

    return [
      socialPosts,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  //Get all reported social posts
  public getReportedSocialPosts = async (pagination: Pagination) => {
    //Count all reported social posts request
    const totalReportedPosts = await ReportedSocialPosts.countDocuments({
      _isSensored: false,
    });
    if (totalReportedPosts <= 0) throw Errors.ReportedPostNotFound;

    const totalPages = Math.ceil(totalReportedPosts / pagination.limit);
    if (pagination.page > totalPages) throw Errors.PageNotFound;

    //Get all reported social posts
    const reportedSocialPosts = await ReportedSocialPosts.aggregate([
      {
        $match: {
          _isSensored: false,
        },
      },
      {
        $lookup: {
          from: "social-posts",
          localField: "_postId",
          foreignField: "_id",
          as: "socialPost",
        },
      },
      {
        $unwind: "$socialPost",
      },
      {
        $lookup: {
          from: "users",
          localField: "_uIdReported",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $project: {
          _id: 1,
          _postId: "$socialPost._id",
          _title: "$socialPost._title",
          _content: "$socialPost._content",
          _images: "$socialPost._images",
          _totalComment: "$socialPost._totalComment",
          _totalLike: "$socialPost._totalLike",
          _status: "$socialPost._status",
          _reason: 1,
          _uRequest: {
            $size: "$_uId",
          },
          _uIdReported: 1,
          _auName: {
            $concat: ["$author._fname", " ", "$author._lname"],
          },
          _auEmail: "$author._email",
          _auAvatar: "$author._avatar",
          _createdAt: 1,
        },
      },
    ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (reportedSocialPosts.length <= 0) throw Errors.PageNotFound;

    //Convert UTC time to Local time
    reportedSocialPosts.forEach((post) => {
      post._createdAtLocal = convertUTCtoLocal(post._createdAt);
      delete post._createdAt;
    });

    return [
      reportedSocialPosts,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  //Get Reported Social Post By Id
  public getReportedSocialPostById = async (
    reportedId: string,
    notiId: string | undefined
  ) => {
    //Read Notification
    if (notiId) this.notificationService.getNotificationById(notiId);

    //Check reported request is existed
    const reportedSocial = await ReportedSocialPosts.aggregate([
      {
        $match: {
          $and: [
            {
              _isSensored: false,
            },
            {
              _id: new mongoose.Types.ObjectId(reportedId),
            },
          ],
        },
      },
      {
        $lookup: {
          from: "social-posts",
          localField: "_postId",
          foreignField: "_id",
          as: "socialPost",
        },
      },
      {
        $unwind: "$socialPost",
      },
      {
        $lookup: {
          from: "users",
          localField: "_uIdReported",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $project: {
          _id: 1,
          _postId: "$socialPost._id",
          _title: "$socialPost._title",
          _content: "$socialPost._content",
          _image: "$socialPost._images",
          _totalComment: "$socialPost._totalComment",
          _totalLike: "$socialPost._totalLike",
          _status: "$socialPost._status",
          _reason: 1,
          _uId: 1,
          _uIdReported: 1,
          _auName: {
            $concat: ["$author._fname", " ", "$author._lname"],
          },
          _auEmail: "$author._email",
          _auAvatar: "$author._avatar",
          _createdAt: 1,
        },
      },
    ]);
    if (reportedSocial.length <= 0) throw Errors.ReportedPostNotFound;

    //Convert UTC time to Local time
    reportedSocial[0]._createdAtLocal = convertUTCtoLocal(
      reportedSocial[0]._createdAt
    );
    delete reportedSocial[0]._createdAt;

    return reportedSocial[0];
  };

  //Search social post by id
  public searchSocialPostForAdmin = async (
    keyword: string,
    pagination: Pagination
  ) => {
    //Check keyword is ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(keyword);

    //Search social post by id
    if (isObjectId) {
      const socialPost = await SocialPosts.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(keyword),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_uId",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: "$author" },
        {
          $lookup: {
            from: "reported-social-posts",
            localField: "_id",
            foreignField: "_postId",
            let: { status_post: "$_status" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_isSensored", true] },
                      { $eq: ["$$status_post", 2] },
                    ],
                  },
                },
              },
            ],
            as: "reportedPost",
          },
        },
        {
          $unwind: {
            preserveNullAndEmptyArrays: true,
            path: "$reportedPost",
          },
        },
        {
          $addFields: {
            _uRequest: {
              $cond: {
                if: "$reportedPost._uId",
                then: { $size: "$reportedPost._uId" },
                else: 0,
              },
            },
          },
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
            _uId: 1,
            _auName: { $concat: ["$author._fname", " ", "$author._lname"] },
            _auEmail: "$author._email",
            _auAvatar: "$author._avatar",
            _uRequest: 1,
            _createdAt: 1,
          },
        },
      ]);
      if (socialPost.length <= 0) throw Errors.PostNotFound;

      //Convert UTC time to Local time
      socialPost[0]._createdAtLocal = convertUTCtoLocal(
        socialPost[0]._createdAt
      );
      delete socialPost[0]._createdAt;

      return [
        socialPost,
        { page: pagination.page, limit: pagination.limit, total: 1 },
      ];
    } else {
      //Search author for social post
      const author = await Users.aggregate([
        {
          $match: {
            _email: keyword,
          },
        },
      ]);
      console.log(
        "🚀 ~ SocialPostsService ~ searchSocialPostForAdmin= ~ author:",
        keyword
      );
      if (author.length <= 0) throw Errors.UserNotFound;

      //Count total social posts by author
      const totalSocialPosts = await SocialPosts.countDocuments({
        _uId: author[0]._id,
      });
      if (totalSocialPosts <= 0) throw Errors.PostNotFound;

      //Calculate total pages
      const totalPages = Math.ceil(totalSocialPosts / pagination.limit);
      if (pagination.page > totalPages) throw Errors.PageNotFound;

      //Search social post by author
      const socialPost = await SocialPosts.aggregate([
        {
          $match: {
            _uId: author[0]._id,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_uId",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: "$author" },
        {
          $lookup: {
            from: "reported-social-posts",
            localField: "_id",
            foreignField: "_postId",
            let: { status_post: "$_status" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_isSensored", true] },
                      { $eq: ["$$status_post", 2] },
                    ],
                  },
                },
              },
            ],
            as: "reportedPost",
          },
        },
        {
          $unwind: {
            preserveNullAndEmptyArrays: true,
            path: "$reportedPost",
          },
        },
        {
          $addFields: {
            _uRequest: {
              $cond: {
                if: "$reportedPost._uId",
                then: { $size: "$reportedPost._uId" },
                else: 0,
              },
            },
          },
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
            _uId: 1,
            _auName: { $concat: ["$author._fname", " ", "$author._lname"] },
            _auEmail: "$author._email",
            _auAvatar: "$author._avatar",
            _uRequest: 1,
            _createdAt: 1,
          },
        },
      ])
        .skip(pagination.offset)
        .limit(pagination.limit);
      if (socialPost.length <= 0) throw Errors.PostNotFound;

      //Convert UTC time to Local time
      socialPost.forEach((post) => {
        post._createdAtLocal = convertUTCtoLocal(post._createdAt);
        delete post._createdAt;
      });

      return [
        socialPost,
        { page: pagination.page, limit: pagination.limit, total: totalPages },
      ];
    }
  };

  //Sensor reported social post
  public sensorReportedSocialPost = async (
    reportedId: string,
    inspectorId: string,
    status: number,
    session: ClientSession
  ) => {
    let totalReported = 0;
    //Check reported request is existed
    const reportedSocial = await ReportedSocialPosts.findOneAndUpdate(
      {
        $and: [
          { _id: new mongoose.Types.ObjectId(reportedId) },
          { _isSensored: false },
        ],
      },
      { _isSensored: true },
      { session }
    );
    if (!reportedSocial) throw Errors.ReportedPostNotFound;

    if (status) {
      totalReported = await SocialPosts.countDocuments({
        $and: [{ _uId: reportedSocial._uIdReported }, { _status: 2 }],
      });
      console.log("🚀 ~ SocialPostsService ~ totalReported:", totalReported);
      const socialPost = await SocialPosts.findOne({
        $and: [
          {
            _id: reportedSocial._postId,
          },
          { _status: 0 },
        ],
      }).session(session);
      if (!socialPost) throw Errors.PostNotFound;

      const blockedPost = await SocialPosts.findOneAndUpdate(
        { _id: reportedSocial._postId },
        {
          _status: 2,
          _reason: reportedSocial._reason,
          _inspectId: new mongoose.Types.ObjectId(inspectorId),
        },
        { session, new: true }
      );
      if (!blockedPost) throw Errors.SaveToDatabaseFail;
      
      //Create notification or block user
      if (totalReported >= 2) {
        console.log("🚀 ~ SocialPostsService ~ blockedPost:", blockedPost._uId)
        const blockedUser = await this.userService.blockUser(
          blockedPost._uId.toString(),
          session
        );
        if (!blockedUser) throw Errors.SaveToDatabaseFail;
        console.log("🚀 ~ SocialPostsService ~ blockedUser:", blockedUser)

        //send mail to user
        const payload: SendMailDTO = {
          email: blockedUser._email,
          subject: "Thông báo khóa tài khoản Rental Hub",
          text: "Thông báo khóa tài khoản Rental Hub",
          html: `<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
<meta charset="UTF-8"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>*|MC:SUBJECT|*</title>
<style>          img{-ms-interpolation-mode:bicubic;} 
          table, td{mso-table-lspace:0pt; mso-table-rspace:0pt;} 
          .mceStandardButton, .mceStandardButton td, .mceStandardButton td a{mso-hide:all !important;} 
          p, a, li, td, blockquote{mso-line-height-rule:exactly;} 
          p, a, li, td, body, table, blockquote{-ms-text-size-adjust:100%; -webkit-text-size-adjust:100%;} 
          @media only screen and (max-width: 480px){
            body, table, td, p, a, li, blockquote{-webkit-text-size-adjust:none !important;} 
          }
          .mcnPreviewText{display: none !important;} 
          .bodyCell{margin:0 auto; padding:0; width:100%;}
          .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font{line-height:100%;} 
          .ReadMsgBody{width:100%;} .ExternalClass{width:100%;} 
          a[x-apple-data-detectors]{color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important;} 
            body{height:100%; margin:0; padding:0; width:100%; background: #ffffff;}
            p{margin:0; padding:0;} 
            table{border-collapse:collapse;} 
            td, p, a{word-break:break-word;} 
            h1, h2, h3, h4, h5, h6{display:block; margin:0; padding:0;} 
            img, a img{border:0; height:auto; outline:none; text-decoration:none;} 
            a[href^="tel"], a[href^="sms"]{color:inherit; cursor:default; text-decoration:none;} 
            li p {margin: 0 !important;}
            .ProseMirror a {
                pointer-events: none;
            }
            @media only screen and (max-width: 640px){
                .mceClusterLayout td{padding: 4px !important;} 
            }
            @media only screen and (max-width: 480px){
                body{width:100% !important; min-width:100% !important; } 
                body.mobile-native {
                    -webkit-user-select: none; user-select: none; transition: transform 0.2s ease-in; transform-origin: top center;
                }
                body.mobile-native.selection-allowed a, body.mobile-native.selection-allowed .ProseMirror {
                    user-select: auto;
                    -webkit-user-select: auto;
                }
                colgroup{display: none;}
                img{height: auto !important;}
                .mceWidthContainer{max-width: 660px !important;}
                .mceColumn{display: block !important; width: 100% !important;}
                .mceColumn-forceSpan{display: table-cell !important; width: auto !important;}
                .mceColumn-forceSpan .mceButton a{min-width:0 !important;}
                .mceBlockContainer{padding-right:16px !important; padding-left:16px !important;} 
                .mceTextBlockContainer{padding-right:16px !important; padding-left:16px !important;} 
                .mceBlockContainerE2E{padding-right:0px; padding-left:0px;} 
                .mceSpacing-24{padding-right:16px !important; padding-left:16px !important;}
                .mceImage, .mceLogo{width: 100% !important; height: auto !important;} 
                .mceFooterSection .mceText, .mceFooterSection .mceText p{font-size: 16px !important; line-height: 140% !important;}
            }
            div[contenteditable="true"] {outline: 0;}
            .ProseMirror .empty-node, .ProseMirror:empty {position: relative;}
            .ProseMirror .empty-node::before, .ProseMirror:empty::before {
                position: absolute;
                left: 0;
                right: 0;
                color: rgba(0,0,0,0.2);
                cursor: text;
            }
            .ProseMirror .empty-node:hover::before, .ProseMirror:empty:hover::before {
                color: rgba(0,0,0,0.3);
            }
            a .ProseMirror p.empty-node::before, a .ProseMirror:empty::before {
                content: '';
            }
            .mceText, .ProseMirror {
                white-space: pre-wrap;
            }
            .ProseMirror h1.empty-node:only-child::before,
            .ProseMirror h2.empty-node:only-child::before,
            .ProseMirror h3.empty-node:only-child::before,
            .ProseMirror h4.empty-node:only-child::before {
                content: 'Heading';
            }
            .ProseMirror p.empty-node:only-child::before, .ProseMirror:empty::before {
                content: 'Start typing...';
            }
            .mceImageBorder {display: inline-block;}
            .mceImageBorder img {border: 0 !important;}
body, #bodyTable { background-color: rgb(244, 244, 244); }.mceText, .mceLabel { font-family: "Helvetica Neue", Helvetica, Arial, Verdana, sans-serif; }.mceText, .mceLabel { color: rgb(0, 0, 0); }.mceText h1 { margin-bottom: 0px; }.mceText p { margin-bottom: 0px; }.mceText label { margin-bottom: 0px; }.mceText input { margin-bottom: 0px; }.mceSpacing-12 .mceInput + .mceErrorMessage { margin-top: -6px; }.mceText h1 { margin-bottom: 0px; }.mceText p { margin-bottom: 0px; }.mceText label { margin-bottom: 0px; }.mceText input { margin-bottom: 0px; }.mceSpacing-24 .mceInput + .mceErrorMessage { margin-top: -12px; }.mceInput { background-color: transparent; border: 2px solid rgb(208, 208, 208); width: 60%; color: rgb(77, 77, 77); display: block; }.mceInput[type="radio"], .mceInput[type="checkbox"] { float: left; margin-right: 12px; display: inline; width: auto !important; }.mceLabel > .mceInput { margin-bottom: 0px; margin-top: 2px; }.mceLabel { display: block; }.mceText p { color: rgb(0, 0, 0); font-family: "Helvetica Neue", Helvetica, Arial, Verdana, sans-serif; font-size: 16px; font-weight: normal; line-height: 150%; text-align: center; direction: ltr; }.mceText h1 { color: rgb(0, 0, 0); font-family: "Helvetica Neue", Helvetica, Arial, Verdana, sans-serif; font-size: 31px; font-weight: bold; line-height: 150%; text-align: center; direction: ltr; }.mceText a { color: rgb(0, 0, 0); font-style: normal; font-weight: normal; text-decoration: underline; direction: ltr; }
@media only screen and (max-width: 480px) {
            .mceText p { font-size: 16px !important; line-height: 150% !important; }
          }
@media only screen and (max-width: 480px) {
            .mceText h1 { font-size: 31px !important; line-height: 150% !important; }
          }
@media only screen and (max-width: 480px) {
            .mceBlockContainer { padding-left: 16px !important; padding-right: 16px !important; }
          }
@media only screen and (max-width: 480px) {
            .mceDividerContainer { width: 100% !important; }
          }
#dataBlockId-9 p, #dataBlockId-9 h1, #dataBlockId-9 h2, #dataBlockId-9 h3, #dataBlockId-9 h4, #dataBlockId-9 ul { text-align: center; }</style>
<script>!function(){function o(n,i){if(n&&i)for(var r in i)i.hasOwnProperty(r)&&(void 0===n[r]?n[r]=i[r]:n[r].constructor===Object&&i[r].constructor===Object?o(n[r],i[r]):n[r]=i[r])}try{var n=decodeURIComponent("%7B%0A%22ResourceTiming%22%3A%7B%0A%22comment%22%3A%20%22Clear%20RT%20Buffer%20on%20mPulse%20beacon%22%2C%0A%22clearOnBeacon%22%3A%20true%0A%7D%2C%0A%22AutoXHR%22%3A%7B%0A%22comment%22%3A%20%22Monitor%20XHRs%20requested%20using%20FETCH%22%2C%0A%22monitorFetch%22%3A%20true%2C%0A%22comment%22%3A%20%22Start%20Monitoring%20SPAs%20from%20Click%22%2C%0A%22spaStartFromClick%22%3A%20true%0A%7D%2C%0A%22PageParams%22%3A%7B%0A%22comment%22%3A%20%22Monitor%20all%20SPA%20XHRs%22%2C%0A%22spaXhr%22%3A%20%22all%22%0A%7D%0A%7D");if(n.length>0&&window.JSON&&"function"==typeof window.JSON.parse){var i=JSON.parse(n);void 0!==window.BOOMR_config?o(window.BOOMR_config,i):window.BOOMR_config=i}}catch(r){window.console&&"function"==typeof window.console.error&&console.error("mPulse: Could not parse configuration",r)}}();</script>
                              <script>!function(a){var e="https://s.go-mpulse.net/boomerang/",t="addEventListener";if("True"=="True")a.BOOMR_config=a.BOOMR_config||{},a.BOOMR_config.PageParams=a.BOOMR_config.PageParams||{},a.BOOMR_config.PageParams.pci=!0,e="https://s2.go-mpulse.net/boomerang/";if(window.BOOMR_API_key="QAT5G-9HZLF-7EDMX-YMVCJ-QZJDA",function(){function n(e){a.BOOMR_onload=e&&e.timeStamp||(new Date).getTime()}if(!a.BOOMR||!a.BOOMR.version&&!a.BOOMR.snippetExecuted){a.BOOMR=a.BOOMR||{},a.BOOMR.snippetExecuted=!0;var i,_,o,r=document.createElement("iframe");if(a[t])a[t]("load",n,!1);else if(a.attachEvent)a.attachEvent("onload",n);r.src="javascript:void(0)",r.title="",r.role="presentation",(r.frameElement||r).style.cssText="width:0;height:0;border:0;display:none;",o=document.getElementsByTagName("script")[0],o.parentNode.insertBefore(r,o);try{_=r.contentWindow.document}catch(O){i=document.domain,r.src="javascript:var d=document.open();d.domain='"+i+"';void(0);",_=r.contentWindow.document}_.open()._l=function(){var a=this.createElement("script");if(i)this.domain=i;a.id="boomr-if-as",a.src=e+"QAT5G-9HZLF-7EDMX-YMVCJ-QZJDA",BOOMR_lstart=(new Date).getTime(),this.body.appendChild(a)},_.write("<bo"+'dy onload="document._l();">'),_.close()}}(),"400".length>0)if(a&&"performance"in a&&a.performance&&"function"==typeof a.performance.setResourceTimingBufferSize)a.performance.setResourceTimingBufferSize(400);!function(){if(BOOMR=a.BOOMR||{},BOOMR.plugins=BOOMR.plugins||{},!BOOMR.plugins.AK){var e=""=="true"?1:0,t="",n="b2qqudyxhrdqqzus4qwq-f-2d71524dd-clientnsv4-s.akamaihd.net",i="false"=="true"?2:1,_={"ak.v":"37","ak.cp":"1513051","ak.ai":parseInt("963350",10),"ak.ol":"0","ak.cr":19,"ak.ipv":4,"ak.proto":"h2","ak.rid":"1b0ae052","ak.r":29326,"ak.a2":e,"ak.m":"x","ak.n":"essl","ak.bpcip":"14.161.10.0","ak.cport":11605,"ak.gh":"113.171.234.162","ak.quicv":"","ak.tlsv":"tls1.3","ak.0rtt":"","ak.csrc":"-","ak.acc":"","ak.t":"1720902701","ak.ak":"hOBiQwZUYzCg5VSAfCLimQ==dODDIQQiQq85tW/uwt9anqxdLtxurDhReoWa7oHZh5kyq/vJI7CeYpRQH5ae9YAAhAhQyeebpVacvfIVSzWvUrGgH5Bw+36LmGVq0F5V7MI1z1atInJq68vYYbPyqFKSzz/ONxR6OqCh0iaquhwcW59zQYeHA7zU/3cJCiLeMPstomYMpaRCoarkjGOZasOBEWeU9gec6ydnwvSHij1n87QJkaFHDkr+x0FVHDRj7C50toquVqGl8kzJJKFwqoVmgMGFvuwsuzeG4NDluppJRhxT1iNAPKJ1Dr44MRwtlqWhM4QWIC9uu6LFcQ1VbNjdJo0CNVcaAu+9HbFVlHYC3SCOYsmO3lXQ0zdqiTB+M/sKqr42PMcQwhcHDCPpE84NNtutDHpmUz6sEl0SDJJkT/uscDHJlmxn2pplNjly6TA=","ak.pv":"39","ak.dpoabenc":"","ak.tf":i};if(""!==t)_["ak.ruds"]=t;var o={i:!1,av:function(e){var t="http.initiator";if(e&&(!e[t]||"spa_hard"===e[t]))_["ak.feo"]=void 0!==a.aFeoApplied?1:0,BOOMR.addVar(_)},rv:function(){var a=["ak.bpcip","ak.cport","ak.cr","ak.csrc","ak.gh","ak.ipv","ak.m","ak.n","ak.ol","ak.proto","ak.quicv","ak.tlsv","ak.0rtt","ak.r","ak.acc","ak.t","ak.tf"];BOOMR.removeVar(a)}};BOOMR.plugins.AK={akVars:_,akDNSPreFetchDomain:n,init:function(){if(!o.i){var a=BOOMR.subscribe;a("before_beacon",o.av,null,null),a("onbeacon",o.rv,null,null),o.i=!0}return this},is_complete:function(){return!0}}}}()}(window);</script></head>
<body>
<!--*|IF:MC_PREVIEW_TEXT|*-->
<!--[if !gte mso 9]><!----><span class="mcnPreviewText" style="display:none; font-size:0px; line-height:0px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; visibility:hidden; mso-hide:all;">*|MC_PREVIEW_TEXT|*</span><!--<![endif]-->
<!--*|END:IF|*-->
<center>
<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable" style="background-color: rgb(244, 244, 244);">
<tbody><tr>
<td class="bodyCell" align="center" valign="top">
<table id="root" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody data-block-id="13" class="mceWrapper"><tr><td align="center" valign="top" class="mceWrapperOuter"><!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="660" style="width:660px;"><tr><td><![endif]--><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px" role="presentation"><tbody><tr><td style="background-color:#ffffff;background-position:center;background-repeat:no-repeat;background-size:cover" class="mceWrapperInner" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="12"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td style="padding-top:0;padding-bottom:0" class="mceColumn" data-block-id="-4" valign="top" colspan="12" width="100%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:48px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="1" class="mceText" id="dataBlockId-1" style="width:100%"><p class="last-child"><a href="*|ARCHIVE|*">View this email in your browser</a></p></div></td></tr></tbody></table></td></tr><tr><td style="padding-top:12px;padding-bottom:12px;padding-right:48px;padding-left:48px" class="mceBlockContainer" align="center" valign="top"><span class="mceImageBorder" style="border:0;vertical-align:top;margin:0"><img data-block-id="2" width="239.61661341853036" height="auto" style="width:239.61661341853036px;height:auto;max-width:239.61661341853036px !important;display:block" alt="" src="https://mcusercontent.com/855a0838a24019210572f018b/images/3284760d-2c5f-74c4-9d4e-71e84569ae94.png" role="presentation" class="imageDropZone mceLogo"/></span></td></tr><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="3" class="mceText" id="dataBlockId-3" style="width:100%"><h1><span style="color:#ff8c82;">Thông báo khóa tài khoản</span></h1><p class="last-child"><em>Tài khoản mang id ${blockedPost._uId} của bạn đã bị khóa do bị báo cáo quá nhiều. Vui lòng liên hệ quản trị viên thông qua số điện thoại 0818492109 để được hỗ trợ!!</em></p></div></td></tr></tbody></table></td></tr><tr><td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer" data-block-id="6"><tbody><tr><td style="min-width:100%;border-top:2px solid #000000" class="mceDividerBlock" valign="top"></td></tr></tbody></table></td></tr><tr><td style="padding-top:8px;padding-bottom:8px;padding-right:8px;padding-left:8px" class="mceLayoutContainer" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="11" id="section_1b0db26c4332f5dd2d13611a664737a8" class="mceFooterSection"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="12" width="100%" role="presentation"><tbody><tr><td style="padding-top:0;padding-bottom:0;margin-bottom:12px" class="mceColumn" data-block-id="-3" valign="top" colspan="12" width="100%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" align="center" valign="top"><table width="100%" style="border:0;border-collapse:separate"><tbody><tr><td style="padding-left:16px;padding-right:16px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="9" class="mceText" id="dataBlockId-9" style="display:inline-block;width:100%"><p class="last-child"><br/></p></div></td></tr></tbody></table></td></tr><tr><td class="mceLayoutContainer" align="center" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="-2"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td class="mceColumn" data-block-id="-5" valign="top" colspan="12" width="100%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td align="center" valign="top"><div><div data-block-id="10"><a href="http://eepurl.com/iTIhHo" target="_blank" rel="noopener noreferrer"><img style="max-width:100%" width="137" height="53" alt="Email Marketing Powered by Mailchimp" title="Mailchimp Email Marketing" src="https://cdn-images.mailchimp.com/monkey_rewards/intuit-mc-rewards-1.png"/></a></div></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]--></td></tr></tbody></table>
</td>
</tr>
</tbody></table>
</center>
<script type="text/javascript"  src="/wNAADi_iXcb1ZDhPLCt52-hkk6w/tOEab4zGpcpb/bB8MYypVAQ/N0x/LZAN7NWI"></script></body></html>`,
        };
        await this.otpService.sendEmail(payload);
      } else {
        const notification = CreateNotificationDTO.fromService({
          _uId: reportedSocial._uIdReported,
          _postId: reportedSocial._postId,
          _type: "REPORTED_SOCIAL_POST",
          _title: "Bài viết mạng xã hội của bạn đã bị xóa",
          _message: `Bài viết mang ID ${reportedSocial._postId} của bạn đã bị xóa do vi phạm quy định của chúng tôi.`,
        });
  
        const newNotification = await this.notificationService.createNotification(
          notification,
          session
        );
        if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;
  
        //Emit event "sendNotification" for internal server
        eventEmitter.emit("sendNotification", {
          ...newNotification[0],
          recipientRole: 0,
          recipientId: reportedSocial._uIdReported,
        });
      }
      
      await session.commitTransaction();
      return blockedPost;
    }

    await session.commitTransaction();
    return true;
  };

  //Admin
  //Manage social post status for admin
  public unBlockSocialPost = async (postId: string, session: ClientSession) => {
    //Check social post has status = 2
    const socialPost = await SocialPosts.findOne({
      $and: [{ _id: new mongoose.Types.ObjectId(postId) }, { _status: 2 }],
    }).session(session);
    if (!socialPost) throw Errors.PostNotFound;

    //Unblock social post
    const unblockedPost = await SocialPosts.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(postId) },
      { _status: 0 },
      { session, new: true }
    );
    if (!unblockedPost) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return unblockedPost;
  };
}
