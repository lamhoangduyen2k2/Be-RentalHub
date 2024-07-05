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
  public searchSocialPostForAdmin = async (keyword: string, pagination: Pagination) => {
    //Check keyword is ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(keyword);

    //Search social post by id
    if (isObjectId) {
      const socialPost = await SocialPosts.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(keyword),
          }
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
      if (socialPost.length <= 0) throw Errors.PostNotFound;

      //Convert UTC time to Local time
      socialPost[0]._createdAtLocal = convertUTCtoLocal(socialPost[0]._createdAt);
      delete socialPost[0]._createdAt;

      return [
        socialPost[0],
        { page: pagination.page, limit: pagination.limit, total: 1 },
      ];
    } else {
      //Search author for social post
      const author = await Users.aggregate([
        {
          $match: {
            _email: keyword,
          }
        },
      ])
      console.log("🚀 ~ SocialPostsService ~ searchSocialPostForAdmin= ~ author:", keyword)
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
          }
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
      socialPost.forEach(post => {
        post._createdAtLocal = convertUTCtoLocal(post._createdAt);
        delete post._createdAt;
      })

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

      //Create notification
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
