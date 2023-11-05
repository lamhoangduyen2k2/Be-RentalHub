import { Service } from "typedi";
import Posts from "./posts.model";
import { PostCreateDTO } from "./dtos/post-create.dto";
import { Errors } from "../../helpers/handle-errors";
import { PostUpdateDTO } from "./dtos/post-update.dto";
import Users from "../user/users.model";
import { Pagination } from "../../helpers/response";
import Rooms from "../rooms/rooms.model";
import { PostResponseDTO } from "./dtos/post-response.dto";

@Service()
export class PostsService {
  public createNewPost = async (postParam: PostCreateDTO) => {
    const user = await Users.findOne({
      $and: [{ _id: postParam._uId }, { _isHost: true }],
    });

    if (!user) throw Errors.UserNotFound;

    const newRoom = await Rooms.create({
      _uId: postParam._uId,
      _address: postParam._address,
      _services: postParam._services,
      _utilities: postParam._utilities,
      _area: postParam._area,
      _price: postParam._price,
      _electricPrice: postParam._electricPrice,
      _waterPrice: postParam._waterPrice,
    });

    if (!newRoom) throw Errors.SaveToDatabaseFail;

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
    console.log(postId);
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
    const posts = await Rooms.aggregate([
      {
        $lookup: {
          from: "posts",
          let: { rooms: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_rooms", "$$rooms"] },
                    { $eq: ["$_status", 1] },
                  ],
                },
              },
            },
          ],
          as: "posts",
        },
      },
      {
        $project: {
          _id: 1,
          _address: 1,
          _services: 1,
          _utilities: 1,
          _area: 1,
          _price: 1,
          _electricPrice: 1,
          _waterPrice: 1,
          posts: 1,
        },
      },
    ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    posts.forEach((post, index) => {
      if (post.posts.length <= 0) {
        posts.splice(index, 1);
      }
    });
    if (!posts[0]?._id) throw Errors.PageNotFound;

    return [
      posts,
      { page: pagination.page, limit: pagination.limit, total: count },
    ];
  };
}
