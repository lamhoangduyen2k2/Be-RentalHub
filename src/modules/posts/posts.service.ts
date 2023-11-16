import Container, { Service } from "typedi";
import Posts from "./posts.model";
import { PostCreateDTO } from "./dtos/post-create.dto";
import { Errors } from "../../helpers/handle-errors";
import { PostUpdateDTO } from "./dtos/post-update.dto";
import Users from "../user/users.model";
import { Pagination } from "../../helpers/response";
import Rooms from "../rooms/rooms.model";
import { PostResponseDTO } from "./dtos/post-response.dto";
import { ImageService } from "../image/image.service";

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
      _services: postParam._services,
      _utilities: postParam._utilities,
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

  public updatePost = async (postParam: PostUpdateDTO, postId: string) => {
    const post = await Posts.findOne({
      $and: [{ _id: postId }, { _uId: postParam._uId }, { _active: true }],
    });

    if (!post) throw Errors.PostNotFound;

    if (postParam._status === 2) {
      postParam._active = false;
    }

    await Posts.updateOne(
      { _id: postId },
      {
        _title: postParam._title,
        _images: postParam._images,
        _content: postParam._content,
        _desc: postParam._desc,
        _tags: postParam._tags,
        _status: postParam._status,
        _active: postParam._active,
      }
    );

    await Rooms.updateOne(
      { _id: post._rooms },
      {
        _address: postParam._address,
        _services: postParam._services,
        _utilities: postParam._utilities,
        _area: postParam._area,
        _price: postParam._price,
        _electricPrice: postParam._electricPrice,
        _waterPrice: postParam._waterPrice,
        _isRented: postParam._isRented,
      }
    );
    //if (updatedPost.matchedCount <= 0) throw Errors.SaveToDatabaseFail;

    return {
      message: "Update post successfully",
    };
  };

  public sensorPost = async (postParam: PostUpdateDTO, postId: string) => {
    await Posts.findById(postId)
      .then((result) => {
        console.log(result);
      })
      .catch(() => {
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
          roomAddress: "$room._address",
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

  // public getPostByStatus = async (
  //   pagination: Pagination,
  //   status: number,
  //   uId: number
  // ) => {
  //   let count: number
  //   let totalPages: number
  //   let condition = 
  //   if (status) {
  //     const count = await Posts.countDocuments({
  //       $and: [{ _status: status }, { _uId: uId }],
  //     });
  //     const totalPages = Math.ceil(count / pagination.limit);
  //   }
  // };
}
