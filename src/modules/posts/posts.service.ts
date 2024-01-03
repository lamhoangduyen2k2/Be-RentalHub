import Container, { Service } from "typedi";
import Posts from "./posts.model";
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

@Service()
export class PostsService {
  imageService = Container.get(ImageService);

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
          _postingDate: 1,
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
          _postingDate: 1,
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
          _postingDate: 1,
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
          _postingDate: 1,
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
          _postingDate: 1,
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
    console.log(
      "🚀 ~ file: posts.service.ts:482 ~ PostsService ~ getPostSimilar= ~ count:",
      count
    );
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
          _postingDate: 1,
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
    console.log(
      "🚀 ~ file: posts.service.ts:650 ~ PostsService ~ count:",
      count
    );
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
    if (status > 3 || status <= -1) throw Errors.StatusInvalid;

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
    console.log(
      "🚀 ~ file: posts.service.ts:867 ~ PostsService ~ count:",
      count
    );

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
          _postingDate: 1,
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

    return [
      posts,
      { page: pagination.page, limit: pagination.limit, total: totalPage },
    ];
  };

  public searchPostByTags = async (tags: string[], pagination: Pagination) => {
    const pipeline = [];
    const condition: PipelineStage = {
      $match: {
        $and: [{ _status: 1 }, { _tags: { $all: tags } }],
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
          _postingDate: 1,
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

    return [
      posts,
      { page: pagination.page, limit: pagination.limit, total: totalPage },
    ];
  };
}
