import Container, { Service } from "typedi";
import Posts from "./models/posts.model";
import { PostCreateDTO } from "./dtos/post-create.dto";
import { Errors } from "../../helpers/handle-errors";
import { PostUpdateDTO } from "./dtos/post-update.dto";
import Users from "../user/model/users.model";
import { Pagination } from "../../helpers/response";
import Rooms from "../rooms/rooms.model";
import { PostResponseDTO } from "./dtos/post-response.dto";
import { ImageService } from "../image/image.service";
import mongoose, { PipelineStage } from "mongoose";
import { PostSensorDTO } from "./dtos/post-sensor.dto";
import { PostUpdateStatusDTO } from "./dtos/post-update-status.dto";
import FavoritePosts from "./models/favorite-posts.model";
import { convertToObjectIdArray, convertUTCtoLocal } from "../../helpers/ultil";
import { ReportCreateDTO } from "./dtos/post-reported.dto";
import ReportedPosts from "./models/reported-posts.model";
import { NotificationService } from "../notification/notification.service";
import { CreateNotificationDTO } from "../notification/dtos/create-notification.dto";

@Service()
export class PostsService {
  imageService = Container.get(ImageService);
  notificationService = Container.get(NotificationService);

  public createNewPost = async (
    postParam: PostCreateDTO,
    files: Express.Multer.File[]
  ) => {
    // Check user is a host
    const user = await Users.findOne({
      $and: [{ _id: postParam._uId }, { _isHost: true }],
    });
    if (!user) throw Errors.UserNotFound;

    //Create new room
    const newRoom = await Rooms.create({
      _uId: postParam._uId,
      _street: postParam._street,
      _district: postParam._district,
      _city: postParam._city,
      _services: postParam._services
        ? postParam._services.split(",")
        : undefined,
      _utilities: postParam._utilities
        ? postParam._utilities.split(",")
        : undefined,
      _area: postParam._area,
      _price: postParam._price,
      _electricPrice: postParam._electricPrice,
      _waterPrice: postParam._waterPrice,
    });
    if (!newRoom) throw Errors.SaveToDatabaseFail;

    //Upload images to firebase
    postParam._images = await this.imageService.uploadImage(files);
    if (postParam._images.length <= 0) throw Errors.UploadImageFail;

    //Create new post
    const newPosts = await Posts.create({
      _content: postParam._content,
      _tags: postParam._tags,
      _images: postParam._images,
      _title: postParam._title,
      _uId: newRoom._uId,
      _desc: postParam._desc,
      _rooms: newRoom._id,
    });
    if (!newPosts) throw Errors.SaveToDatabaseFail;

    const newInfo = { ...newRoom.toObject(), ...newPosts.toObject() };

    return PostResponseDTO.toResponse(newInfo);
  };

  public updatePost = async (
    postParam: PostUpdateDTO,
    postId: string,
    files: Express.Multer.File[]
  ) => {
    let status: number = 0;
    let active: boolean = true;
    let images: string[] = [];

    //Find post is active
    const post = await Posts.findOne({
      $and: [{ _id: postId }, { _uId: postParam._uId }],
    });

    if (!post) throw Errors.PostNotFound;

    if (post._status === 2) {
      status = 2;
      active = false;
    }

    const isRented = /true/i.test(postParam._isRented);
    if (isRented) {
      status = 2;
      active = false;
    }

    if (postParam._deleteImages && postParam._deleteImages.length > 0) {
      const deleteArr = postParam._deleteImages.split(",");

      post._images.forEach((image, index) => {
        if (!deleteArr.includes(index.toString())) {
          images.push(image as string);
        }
      });
    } else {
      images = [...post._images] as string[];
    }

    //Check file images are exist
    if (files.length > 0) {
      if (images.length + files.length > 10) throw Errors.FileCountExceedLimit;
      //Upload images to firebase
      postParam._images = [
        ...images,
        ...(await this.imageService.uploadImage(files)),
      ];
      if (postParam._images.length <= 0) throw Errors.UploadImageFail;
    } else {
      postParam._images = [...images];
    }

    const postUdated = await Posts.findOneAndUpdate(
      { _id: postId },
      {
        _title: postParam._title,
        _images: postParam._images,
        _content: postParam._content,
        _desc: postParam._desc,
        _tags: postParam._tags,
        _status: status,
        _active: active,
      },
      { new: true }
    );

    const roomUpdated = await Rooms.findOneAndUpdate(
      { _id: post._rooms },
      {
        _street: postParam._street,
        _district: postParam._district,
        _city: postParam._city,
        _services: postParam._services
          ? postParam._services.split(",")
          : undefined,
        _utilities: postParam._utilities
          ? postParam._utilities.split(",")
          : undefined,
        _area: postParam._area,
        _price: postParam._price,
        _electricPrice: postParam._electricPrice,
        _waterPrice: postParam._waterPrice,
        _isRented: postParam._isRented,
      },
      { new: true }
    );

    return PostResponseDTO.toResponse({
      ...postUdated.toObject(),
      ...roomUpdated.toObject(),
    });
  };

  public sensorPost = async (postParam: PostSensorDTO, postId: string) => {
    let isRented: boolean = false;
    let active: boolean = true;

    await Posts.findById(postId)
      .then((result) => {
        console.log(result);
      })
      .catch(() => {
        throw Errors.PostNotFound;
      });

    if (postParam._status === 2) {
      active = false;
      isRented = true;
    }

    const updatedPost = await Posts.findOneAndUpdate(
      { _id: postId },
      {
        _status: postParam._status,
        _active: active,
        _inspectId: postParam._uId,
      },
      { new: true }
    );

    await Rooms.updateOne(
      { _id: updatedPost._rooms },
      {
        _isRented: isRented,
      }
    );

    return true;
  };

  public updatePostStatus = async (
    postParam: PostUpdateStatusDTO,
    postId: string
  ) => {
    let status: number = 2;
    let isRented: boolean = true;
    const post = await Posts.findOne({
      $and: [{ _id: postId }, { _uId: postParam._uId }],
    });
    if (!post) throw Errors.PostNotFound;

    if (postParam._active) {
      status = 0;
      isRented = false;
    }

    await Posts.updateOne(
      { _id: postId },
      {
        _status: status,
        _active: postParam._active,
      }
    );

    await Rooms.updateOne({ _id: post._rooms }, { _isRented: isRented });

    return true;
  };

  public getAllPosts = async (pagination: Pagination) => {
    const count = await Posts.countDocuments({ _status: 1 });
    const totalPages = Math.ceil(count / pagination.limit);
    const condition = {
      $match: {
        $and: [{ _status: 1 }],
      },
    };

    const posts = await Posts.aggregate([
      {
        $lookup: {
          from: "rooms",
          localField: "_rooms",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      condition,
      {
        $project: {
          _id: 1,
          _title: 1,
          _content: 1,
          _desc: 1,
          updatedAt: 1,
          _tags: 1,
          _videos: 1,
          _images: 1,
          _inspectId: 1,
          _status: 1,
          roomId: "$room._id",
          roomAddress: {
            $concat: [
              "$room._street",
              ", Quận ",
              "$room._district",
              ", ",
              "$room._city",
            ],
          },
          roomServices: "$room._services",
          roomUtilities: "$room._utilities",
          roomArea: "$room._area",
          roomPrice: "$room._price",
          roomElectricPrice: "$room._electricPrice",
          roomWaterPrice: "$room._waterPrice",
          roomIsRented: "$room._isRented",
          authorId: "$author._id",
          authorFName: "$author._fname",
          authorLName: "$author._lname",
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      },
    ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (!posts[0]?._id) throw Errors.PageNotFound;

    posts.forEach((post) => {
      post._postingDateLocal = convertUTCtoLocal(post.updatedAt);
    });

    return [
      posts,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  private getPosts = async (
    condition: PipelineStage,
    offset: number,
    limit: number
  ) => {
    const posts = await Posts.aggregate([
      {
        $lookup: {
          from: "rooms",
          localField: "_rooms",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
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
          from: "tags",
          localField: "_tags",
          foreignField: "_id",
          let: { id_tags: "$_tags" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$id_tags"] },
              },
            },
          ],
          as: "tags",
        },
      },
      condition,
      {
        $project: {
          _id: 1,
          _title: 1,
          _content: 1,
          _desc: 1,
          updatedAt: 1,
          _tags: "$tags",
          _videos: 1,
          _images: 1,
          _inspectId: 1,
          _status: 1,
          roomId: "$room._id",
          roomAddress: {
            $concat: [
              "$room._street",
              ", Quận ",
              "$room._district",
              ", ",
              "$room._city",
            ],
          },
          roomStreet: "$room._street",
          roomDistrict: "$room._district",
          roomCity: "$room._city",
          roomServices: "$room._services",
          roomUtilities: "$room._utilities",
          roomArea: "$room._area",
          roomPrice: "$room._price",
          roomElectricPrice: "$room._electricPrice",
          roomWaterPrice: "$room._waterPrice",
          roomIsRented: "$room._isRented",
          authorId: "$author._id",
          authorFName: "$author._fname",
          authorLName: "$author._lname",
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      },
    ])
      .skip(offset)
      .limit(limit);

    posts.forEach((post) => {
      post._postingDateLocal = convertUTCtoLocal(post.updatedAt);
    });

    return posts;
  };

  public getPostById = async (postId: string) => {
    const condition = {
      $match: {
        $and: [{ _status: 1 }, { _id: new mongoose.Types.ObjectId(postId) }],
      },
    };

    const post = await Posts.aggregate([
      {
        $lookup: {
          from: "rooms",
          localField: "_rooms",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
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
          from: "tags",
          localField: "_tags",
          foreignField: "_id",
          let: { id_tags: "$_tags" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$id_tags"] },
              },
            },
          ],
          as: "tags",
        },
      },
      condition,
      {
        $project: {
          _id: 1,
          _title: 1,
          _content: 1,
          _desc: 1,
          updatedAt: 1,
          _tags: "$tags",
          _videos: 1,
          _images: 1,
          _inspectId: 1,
          _status: 1,
          roomId: "$room._id",
          roomAddress: {
            $concat: [
              "$room._street",
              ", Quận ",
              "$room._district",
              ", ",
              "$room._city",
            ],
          },
          roomStreet: "$room._street",
          roomDistrict: "$room._district",
          roomCity: "$room._city",
          roomServices: "$room._services",
          roomUtilities: "$room._utilities",
          roomArea: "$room._area",
          roomPrice: "$room._price",
          roomElectricPrice: "$room._electricPrice",
          roomWaterPrice: "$room._waterPrice",
          roomIsRented: "$room._isRented",
          authorId: "$author._id",
          authorEmail: "$author._email",
          authorFName: "$author._fname",
          authorLName: "$author._lname",
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      },
    ]);

    if (post.length <= 0) throw Errors.PostNotFound;

    //Convert UTC to Local time
    post[0]._postingDateLocal = convertUTCtoLocal(post[0].updatedAt);

    return post[0];
  };

  public getPostByIdInspector = async (postId: string) => {
    const condition = {
      $match: {
        _id: new mongoose.Types.ObjectId(postId),
      },
    };

    const post = await Posts.aggregate([
      {
        $lookup: {
          from: "rooms",
          localField: "_rooms",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      condition,
      {
        $project: {
          _id: 1,
          _title: 1,
          _content: 1,
          _desc: 1,
          updatedAt: 1,
          _tags: 1,
          _videos: 1,
          _images: 1,
          _inspectId: 1,
          _status: 1,
          roomId: "$room._id",
          roomAddress: {
            $concat: [
              "$room._street",
              ", Quận ",
              "$room._district",
              ", ",
              "$room._city",
            ],
          },
          roomServices: "$room._services",
          roomUtilities: "$room._utilities",
          roomArea: "$room._area",
          roomPrice: "$room._price",
          roomElectricPrice: "$room._electricPrice",
          roomWaterPrice: "$room._waterPrice",
          roomIsRented: "$room._isRented",
          authorId: "$author._id",
          authorFName: "$author._fname",
          authorLName: "$author._lname",
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      },
    ]);

    if (post.length <= 0) throw Errors.PostNotFound;

    //Convert UTC to Local time
    post[0]._postingDateLocal = convertUTCtoLocal(post[0].updatedAt);

    return post[0];
  };

  public getPostOfUser = async (uId: string, pagination: Pagination) => {
    const count = await Posts.countDocuments({
      $and: [{ _status: 1 }, { _uId: uId }],
    });

    if (count <= 0) throw Errors.PostNotFound;

    const totalPages = Math.ceil(count / pagination.limit);

    const condition = {
      $match: {
        $and: [{ _status: 1 }, { _uId: new mongoose.Types.ObjectId(uId) }],
      },
    };

    const post = await Posts.aggregate([
      {
        $lookup: {
          from: "rooms",
          localField: "_rooms",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      condition,
      {
        $project: {
          _id: 1,
          _title: 1,
          _content: 1,
          _desc: 1,
          updatedAt: 1,
          _tags: 1,
          _videos: 1,
          _images: 1,
          _inspectId: 1,
          _status: 1,
          roomId: "$room._id",
          roomAddress: {
            $concat: [
              "$room._street",
              ", Quận ",
              "$room._district",
              ", ",
              "$room._city",
            ],
          },
          roomServices: "$room._services",
          roomUtilities: "$room._utilities",
          roomArea: "$room._area",
          roomPrice: "$room._price",
          roomElectricPrice: "$room._electricPrice",
          roomWaterPrice: "$room._waterPrice",
          roomIsRented: "$room._isRented",
          authorId: "$author._id",
          authorEmail: "$author._email",
          authorFName: "$author._fname",
          authorLName: "$author._lname",
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      },
    ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (post.length <= 0) throw Errors.PageNotFound;

    post.forEach((pos) => {
      pos._postingDateLocal = convertUTCtoLocal(pos.updatedAt);
    });

    return [
      post,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getPostSimilar = async (postId: string, pagination: Pagination) => {
    const post = await Posts.findOne({ _id: postId });

    const count = await Posts.countDocuments({
      $and: [
        { _id: { $ne: postId } },
        { _status: 1 },
        { _tags: { $in: post._tags } },
      ],
    });

    if (count <= 0) throw Errors.PostNotFound;
    const totalPage = Math.ceil(count / pagination.limit);

    const condition = {
      $match: {
        $and: [
          { _id: { $ne: new mongoose.Types.ObjectId(postId) } },
          { _status: 1 },
          { _tags: { $in: post._tags } },
        ],
      },
    };

    const posts = await Posts.aggregate([
      {
        $lookup: {
          from: "rooms",
          localField: "_rooms",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      condition,
      {
        $project: {
          _id: 1,
          _title: 1,
          _content: 1,
          _desc: 1,
          updatedAt: 1,
          _tags: 1,
          _videos: 1,
          _images: 1,
          _inspectId: 1,
          _status: 1,
          roomId: "$room._id",
          roomAddress: {
            $concat: [
              "$room._street",
              ", Quận ",
              "$room._district",
              ", ",
              "$room._city",
            ],
          },
          roomServices: "$room._services",
          roomUtilities: "$room._utilities",
          roomArea: "$room._area",
          roomPrice: "$room._price",
          roomElectricPrice: "$room._electricPrice",
          roomWaterPrice: "$room._waterPrice",
          roomIsRented: "$room._isRented",
          authorId: "$author._id",
          authorFName: "$author._fname",
          authorLName: "$author._lname",
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      },
    ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (posts.length <= 0) throw Errors.PageNotFound;

    posts.forEach((post) => {
      post._postingDateLocal = convertUTCtoLocal(post.updatedAt);
    });

    return [
      posts,
      { page: pagination.page, limit: pagination.limit, total: totalPage },
    ];
  };

  public getPostByStatus = async (
    pagination: Pagination,
    status: number,
    uId: string
  ) => {
    let count: number;
    let totalPages: number;
    let condition: PipelineStage;

    //Check status
    if (status > 4 || status <= -1) throw Errors.StatusInvalid;

    // Check status to create condition and totalPages
    if (status !== 4) {
      count = await Posts.countDocuments({
        $and: [{ _status: status }, { _uId: uId }],
      });
      if (count <= 0) throw Errors.PostNotFound;

      totalPages = Math.ceil(count / pagination.limit);

      condition = {
        $match: {
          $and: [
            { _status: status },
            { _uId: new mongoose.Types.ObjectId(uId) },
          ],
        },
      };
    } else {
      count = await Posts.countDocuments({
        $and: [{ _uId: uId }],
      });
      if (count <= 0) throw Errors.PostNotFound;
      totalPages = Math.ceil(count / pagination.limit);

      condition = {
        $match: {
          $and: [{ _uId: new mongoose.Types.ObjectId(uId) }],
        },
      };
    }

    const posts = await this.getPosts(
      condition,
      pagination.offset,
      pagination.limit
    );

    if (!posts[0]?._id) throw Errors.PageNotFound;

    return [
      posts,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getPostByInspector = async (
    pagination: Pagination,
    status: number
  ) => {
    //Check status
    if (status > 4 || status <= -1) throw Errors.StatusInvalid;

    // Check status to create condition and totalPages

    const count = await Posts.countDocuments({ _status: status });
    if (count <= 0) throw Errors.PostNotFound;

    const totalPages = Math.ceil(count / pagination.limit);

    const condition: PipelineStage = {
      $match: {
        _status: status,
      },
    };

    const posts = await this.getPosts(
      condition,
      pagination.offset,
      pagination.limit
    );

    if (!posts[0]?._id) throw Errors.PageNotFound;

    return [
      posts,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getPostByStatusInspecttor = async (
    pagination: Pagination,
    status: number,
    uId: string
  ) => {
    let count = 0;
    let condition: PipelineStage;
    //Check status
    if (status > 4 || status <= -1) throw Errors.StatusInvalid;

    // Check status to create condition and totalPages
    if (status === 0) {
      count = await Posts.countDocuments({
        $and: [{ _status: status }],
      });
      condition = {
        $match: {
          _status: status,
        },
      };
    } else {
      count = await Posts.countDocuments({
        $and: [{ _status: status }, { _inspectId: uId }],
      });

      condition = {
        $match: {
          $and: [
            { _status: status },
            { _inspectId: new mongoose.Types.ObjectId(uId) },
          ],
        },
      };
    }

    if (count <= 0) throw Errors.PostNotFound;

    const totalPages = Math.ceil(count / pagination.limit);

    const posts = await this.getPosts(
      condition,
      pagination.offset,
      pagination.limit
    );

    if (!posts[0]?._id) throw Errors.PageNotFound;

    return [
      posts,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public searchPost = async (search: string, pagination: Pagination) => {
    const pipeline = [];
    const condition: PipelineStage = {
      $match: {
        $and: [{ _status: 1 }],
      },
    };

    //Push condition of search
    pipeline.push({
      $search: {
        index: "searchTitle",
        text: {
          query: search,
          path: {
            wildcard: "*",
          },
        },
      },
    });

    //Push condition of joining tables
    pipeline.push(
      {
        $lookup: {
          from: "rooms",
          localField: "_rooms",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      condition,
      {
        $project: {
          _id: 1,
          _title: 1,
          _content: 1,
          _desc: 1,
          updatedAt: 1,
          _tags: 1,
          _videos: 1,
          _images: 1,
          _inspectId: 1,
          _status: 1,
          roomId: "$room._id",
          roomAddress: {
            $concat: [
              "$room._street",
              ", Quận ",
              "$room._district",
              ", ",
              "$room._city",
            ],
          },
          roomServices: "$room._services",
          roomUtilities: "$room._utilities",
          roomArea: "$room._area",
          roomPrice: "$room._price",
          roomElectricPrice: "$room._electricPrice",
          roomWaterPrice: "$room._waterPrice",
          roomIsRented: "$room._isRented",
          authorId: "$author._id",
          authorFName: "$author._fname",
          authorLName: "$author._lname",
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      }
    );
    const total = (await Posts.aggregate(pipeline)).length;
    const totalPage = Math.ceil(total / pagination.limit);
    const posts = await Posts.aggregate(pipeline)
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (posts.length <= 0) throw Errors.PostNotFound;

    posts.forEach((post) => {
      post._postingDateLocal = convertUTCtoLocal(post.updatedAt);
    });

    return [
      posts,
      { page: pagination.page, limit: pagination.limit, total: totalPage },
    ];
  };

  public searchPostByTags = async (tags: string[], pagination: Pagination) => {
    //Convert string to ObjectId of tags
    const tagsObjectId = convertToObjectIdArray(tags);
    const pipeline = [];
    const condition: PipelineStage = {
      $match: {
        $and: [{ _status: 1 }, { _tags: { $all: tagsObjectId } }],
      },
    };

    //Push condition of joining tables
    pipeline.push(
      {
        $lookup: {
          from: "rooms",
          localField: "_rooms",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      condition,
      {
        $project: {
          _id: 1,
          _title: 1,
          _content: 1,
          _desc: 1,
          updatedAt: 1,
          _tags: 1,
          _videos: 1,
          _images: 1,
          _inspectId: 1,
          _status: 1,
          roomId: "$room._id",
          roomAddress: {
            $concat: [
              "$room._street",
              ", Quận ",
              "$room._district",
              ", ",
              "$room._city",
            ],
          },
          roomServices: "$room._services",
          roomUtilities: "$room._utilities",
          roomArea: "$room._area",
          roomPrice: "$room._price",
          roomElectricPrice: "$room._electricPrice",
          roomWaterPrice: "$room._waterPrice",
          roomIsRented: "$room._isRented",
          authorId: "$author._id",
          authorFName: "$author._fname",
          authorLName: "$author._lname",
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      }
    );
    const total = (await Posts.aggregate(pipeline)).length;
    const totalPage = Math.ceil(total / pagination.limit);
    const posts = await Posts.aggregate(pipeline)
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (posts.length <= 0) throw Errors.PostNotFound;

    posts.forEach((post) => {
      post._postingDateLocal = convertUTCtoLocal(post.updatedAt);
    });

    return [
      posts,
      { page: pagination.page, limit: pagination.limit, total: totalPage },
    ];
  };

  public createFavoritePost = async (uId: string, postId: string) => {
    let favoritePosts: typeof FavoritePosts | null = null;
    const post = await Posts.findOne({
      $and: [{ _id: postId }, { _status: 1 }],
    });
    if (!post) throw Errors.PostNotFound;

    const favoritePost = await FavoritePosts.exists({
      $and: [{ _uId: uId }, { _postIds: { $in: [postId] } }],
    });

    if (favoritePost) {
      favoritePosts = await FavoritePosts.findOneAndUpdate(
        { _uId: uId },
        { $pull: { _postIds: postId } },
        { upsert: true, new: true }
      );
    } else {
      favoritePosts = await FavoritePosts.findOneAndUpdate(
        { _uId: uId },
        { $push: { _postIds: postId } },
        { upsert: true, new: true }
      );
    }

    if (!favoritePosts) throw Errors.SaveToDatabaseFail;

    return favoritePosts;
  };

  public getFavoritePost = async (uId: string, pagination: Pagination) => {
    const favoritePost = await FavoritePosts.findOne({ _uId: uId });
    if (!favoritePost) throw Errors.PostFavoriteNotFound;

    let totalFavoritePosts = 0;
    for (const postId of favoritePost._postIds) {
      const post = await Posts.findOne({
        $and: [{ _id: postId }, { _status: 1 }],
      });

      if (post) {
        totalFavoritePosts++;
      }
    }

    const totalPages = Math.ceil(totalFavoritePosts / pagination.limit);

    const favoritePosts = await FavoritePosts.aggregate([
      {
        $match: {
          _uId: new mongoose.Types.ObjectId(uId),
        },
      },
      {
        $unwind: "$_postIds",
      },
      {
        $lookup: {
          from: "posts",
          localField: "_postIds",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_status", 1],
                },
              },
            },
          ],
          as: "post_info",
        },
      },
      { $unwind: "$post_info" },
      {
        $lookup: {
          from: "tags",
          localField: "post_info._tags",
          foreignField: "_id",
          let: { id_tags: "$post_info._tags" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$id_tags"] },
              },
            },
          ],
          as: "tags_info",
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "post_info._rooms",
          foreignField: "_id",
          as: "room_info",
        },
      },
      { $unwind: "$room_info" },
      {
        $lookup: {
          from: "users",
          localField: "post_info._uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          _postId: "$post_info._id",
          _title: "$post_info._title",
          _content: "$post_info._content",
          _desc: "$post_info._desc",
          _tags: "$tags_info",
          _videos: "$post_info._videos",
          _images: "$post_info._images",
          _inspectId: "$post_info._inspectId",
          _status: "$post_info._status",
          updatedAt: "$post_info.updatedAt",
          roomId: "$room_info._id",
          roomAddress: {
            $concat: [
              "$room_info._street",
              ", ",
              "$room_info._district",
              ", ",
              "$room_info._city",
            ],
          },
          roomServices: "$room_info._services",
          roomUtilities: "$room_info._utilities",
          roomArea: "$room_info._area",
          roomPrice: "$room_info._price",
          roomElectricPrice: "$room_info._electricPrice",
          roomWaterPrice: "$room_info._waterPrice",
          roomIsRented: "$room_info._isRented",
          authorId: "$author._id",
          authorEmail: "$author._email",
          authorFullName: {
            $concat: ["$author._lname", " ", "$author._fname"],
          },
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      },
    ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (favoritePosts.length <= 0) throw Errors.PageNotFound;

    favoritePosts.forEach((post) => {
      post._postingDateLocal = convertUTCtoLocal(post.updatedAt);
    });

    return [
      favoritePosts,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getArrayFavoritePosts = async (uId: string) => {
    const favoritePosts = await FavoritePosts.findOne({ _uId: uId });
    if (!favoritePosts) throw Errors.PostFavoriteNotFound;

    const updatedFavoritePosts = await Promise.all(
      favoritePosts._postIds.map(async (postId) => {
        const post = await Posts.findOne({
          $and: [{ _id: postId }, { _status: 1 }],
        });

        if (!post) {
          await FavoritePosts.findOneAndUpdate(
            { _uId: uId },
            { $pull: { _postIds: postId } }
          );
          return null;
        }

        return postId;
      })
    );

    const filteredPostIds = updatedFavoritePosts.filter(
      (postId) => postId !== null
    );

    return filteredPostIds;
  };

  public createReportPost = async (report: ReportCreateDTO) => {
    const post = await Posts.findOne({
      $and: [{ _id: report._postId }, { _status: 1 }],
    });
    if (!post) throw Errors.PostNotFound;

    const newReport = await ReportedPosts.findOneAndUpdate(
      { $and: [{ _postId: report._postId }, { _sensored: false }] },
      {
        $addToSet: {
          _uId: report._uId,
          _uIdReported: report._uIdReported,
          _content: report._content,
        },
        _uIdReported: post._uId,
        _sensored: false,
      },
      { upsert: true, new: true }
    );
    if (!newReport) throw Errors.SaveToDatabaseFail;

    return newReport;
  };

  public getReportPostsList = async (pagination: Pagination) => {
    const count = await ReportedPosts.countDocuments({ _sensored: false });
    if (count <= 0) throw Errors.ReportedPostNotFound;

    const totalPages = Math.ceil(count / pagination.limit);

    const reportPosts = await ReportedPosts.aggregate([
      {
        $match: {
          _sensored: false,
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "_postId",
          foreignField: "_id",
          as: "post_info",
        },
      },
      { $unwind: "$post_info" },
      {
        $lookup: {
          from: "tags",
          localField: "post_info._tags",
          foreignField: "_id",
          let: { id_tags: "$post_info._tags" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$id_tags"] },
              },
            },
          ],
          as: "tags_info",
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "post_info._rooms",
          foreignField: "_id",
          as: "room_info",
        },
      },
      { $unwind: "$room_info" },
      {
        $lookup: {
          from: "users",
          localField: "post_info._uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          _id: 1,
          _uId: 1,
          _postId: "$post_info._id",
          _title: "$post_info._title",
          _content: "$post_info._content",
          _desc: "$post_info._desc",
          _tags: "$tags_info",
          _videos: "$post_info._videos",
          _images: "$post_info._images",
          _inspectId: "$post_info._inspectId",
          _status: "$post_info._status",
          updatedAt: "$post_info.updatedAt",
          roomId: "$room_info._id",
          roomAddress: {
            $concat: [
              "$room_info._street",
              ", ",
              "$room_info._district",
              ", ",
              "$room_info._city",
            ],
          },
          roomServices: "$room_info._services",
          roomUtilities: "$room_info._utilities",
          roomArea: "$room_info._area",
          roomPrice: "$room_info._price",
          roomElectricPrice: "$room_info._electricPrice",
          roomWaterPrice: "$room_info._waterPrice",
          roomIsRented: "$room_info._isRented",
          authorId: "$author._id",
          authorEmail: "$author._email",
          authorFullName: {
            $concat: ["$author._lname", " ", "$author._fname"],
          },
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      },
    ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (reportPosts.length <= 0) throw Errors.PageNotFound;

    reportPosts.forEach((post) => {
      post._postingDateLocal = convertUTCtoLocal(post.updatedAt);
    });

    return [
      reportPosts,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getReportPostById = async (reportId: string) => {
    const reportPost = await ReportedPosts.findOne({ _id: reportId });
    if (!reportPost) throw Errors.ReportedPostNotFound;

    const post = await Posts.findOne({ _id: reportPost._postId });
    if (!post) throw Errors.PostNotFound;

    const reportPostInfo = await ReportedPosts.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(reportId),
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "_postId",
          foreignField: "_id",
          as: "post_info",
        },
      },
      { $unwind: "$post_info" },
      {
        $lookup: {
          from: "tags",
          localField: "post_info._tags",
          foreignField: "_id",
          let: { id_tags: "$post_info._tags" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$id_tags"] },
              },
            },
          ],
          as: "tags_info",
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "post_info._rooms",
          foreignField: "_id",
          as: "room_info",
        },
      },
      { $unwind: "$room_info" },
      {
        $lookup: {
          from: "users",
          localField: "post_info._uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          _id: 1,
          _uId: 1,
          _content: 1,
          _sensored: 1,
          _postId: "$post_info._id",
          _title: "$post_info._title",
          _contentPost: "$post_info._content",
          _desc: "$post_info._desc",
          _tags: "$tags_info",
          _videos: "$post_info._videos",
          _images: "$post_info._images",
          _inspectId: "$post_info._inspectId",
          _status: "$post_info._status",
          updatedAt: "$post_info.updatedAt",
          roomId: "$room_info._id",
          roomAddress: {
            $concat: [
              "$room_info._street",
              ", ",
              "$room_info._district",
              ", ",
              "$room_info._city",
            ],
          },
          roomServices: "$room_info._services",
          roomUtilities: "$room_info._utilities",
          roomArea: "$room_info._area",
          roomPrice: "$room_info._price",
          roomElectricPrice: "$room_info._electricPrice",
          roomWaterPrice: "$room_info._waterPrice",
          roomIsRented: "$room_info._isRented",
          authorId: "$author._id",
          authorEmail: "$author._email",
          authorFullName: {
            $concat: ["$author._lname", " ", "$author._fname"],
          },
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      },
    ]);

    if (reportPostInfo.length <= 0) throw Errors.ReportedPostNotFound;

    reportPostInfo[0]._postingDateLocal = convertUTCtoLocal(
      reportPostInfo[0].updatedAt
    );

    return reportPostInfo[0];
  };

  public sensorReportPost = async (reportId: string, inspectorId: string) => {
    const reportPost = await ReportedPosts.findOneAndUpdate(
      { $and: [{ _id: reportId }, { _sensored: false }] },
      { _sensored: true }
    );
    if (!reportPost) throw Errors.ReportedPostNotFound;

    const post = await Posts.findOne({ _id: reportPost._postId });
    if (!post) throw Errors.PostNotFound;

    const sensorReport = await Posts.findOneAndUpdate(
      { _id: reportPost._postId },
      { _status: 4, _active: false, _inspectId: inspectorId },
      { new: true }
    );
    if (!sensorReport) throw Errors.SaveToDatabaseFail;

    //Create notification
    const notification = CreateNotificationDTO.fromService({
      _uId: reportPost._uIdReported,
      _postId: reportPost._postId,
      _type: "REPORTED_POST",
      _title: "Bài viết của bạn đã bị xóa",
      _message: `Bài viết mang ID ${reportPost._postId} của bạn đã bị xóa do vi phạm quy định của chúng tôi. Vui lòng kiểm tra lại bài viết của bạn.`,
    });

    const newNotification = await this.notificationService.createNotification(
      notification
    );
    if (!newNotification) throw Errors.SaveToDatabaseFail;

    return sensorReport;
  };

  public getReportedPostByUser = async (notiId: string) => {
    const postId = await this.notificationService.getNotificationById(notiId);

    const reportedPost = await ReportedPosts.aggregate([
      {
        $match: {
          $and: [{ _postId: postId }, { _sensored: true }],
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "_postId",
          foreignField: "_id",
          as: "post_info",
        },
      },
      { $unwind: "$post_info" },
      {
        $lookup: {
          from: "tags",
          localField: "post_info._tags",
          foreignField: "_id",
          let: { id_tags: "$post_info._tags" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$id_tags"] },
              },
            },
          ],
          as: "tags_info",
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "post_info._rooms",
          foreignField: "_id",
          as: "room_info",
        },
      },
      { $unwind: "$room_info" },
      {
        $lookup: {
          from: "users",
          localField: "post_info._uId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          _id: 1,
          _uId: 1,
          _content: 1,
          _sensored: 1,
          _postId: "$post_info._id",
          _title: "$post_info._title",
          _contentPost: "$post_info._content",
          _desc: "$post_info._desc",
          _tags: "$tags_info",
          _videos: "$post_info._videos",
          _images: "$post_info._images",
          _inspectId: "$post_info._inspectId",
          _status: "$post_info._status",
          updatedAt: "$post_info.updatedAt",
          roomId: "$room_info._id",
          roomAddress: {
            $concat: [
              "$room_info._street",
              ", ",
              "$room_info._district",
              ", ",
              "$room_info._city",
            ],
          },
          roomServices: "$room_info._services",
          roomUtilities: "$room_info._utilities",
          roomArea: "$room_info._area",
          roomPrice: "$room_info._price",
          roomElectricPrice: "$room_info._electricPrice",
          roomWaterPrice: "$room_info._waterPrice",
          roomIsRented: "$room_info._isRented",
          authorId: "$author._id",
          authorEmail: "$author._email",
          authorFullName: {
            $concat: ["$author._lname", " ", "$author._fname"],
          },
          phoneNumber: "$author._phone",
          addressAuthor: "$author._address",
          avatarAuthor: "$author._avatar",
        },
      },
    ]);

    if (reportedPost.length <= 0) throw Errors.ReportedPostNotFound;

    reportedPost[0]._postingDateLocal = convertUTCtoLocal(
      reportedPost[0].updatedAt
    );

    return reportedPost[0];
  };
}
