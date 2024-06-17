import { Inject, Service } from "typedi";
import { CreateCommentDTO } from "./dtos/create-comment.dto";
import mongoose, { ClientSession } from "mongoose";
import Users from "../user/model/users.model";
import { Errors } from "../../helpers/handle-errors";
import Comments from "./comments.model";
import { CreateNotificationCommentDTO } from "../notification/dtos/create-notification-comment.dto";
import SocialPosts from "../social-posts/social-posts.model";
import { NotificationService } from "../notification/notification.service";
import eventEmitter from "../socket/socket";
import { ImageService } from "../image/image.service";
import { UpdateCommentDTO } from "./dtos/update-comments.dto";

@Service()
export class CommentsService {
  constructor(
    @Inject() private notificationService: NotificationService,
    @Inject() private imageService: ImageService
  ) {}
  //Create comment
  public createComment = async (
    commentInfo: CreateCommentDTO,
    files: Express.Multer.File[],
    session: ClientSession
  ) => {
    let comment = {};
    let parentId: string = "";
    let notification: CreateNotificationCommentDTO;
    //Check  user is exist
    const user = await Users.findOne({
      $and: [
        { _id: new mongoose.Types.ObjectId(commentInfo._uId) },
        { _role: 0 },
        { _active: true },
      ],
    }).session(session);
    if (!user) throw Errors.UserNotFound;

    //Check post is exist
    const post = await SocialPosts.findOne({
      _id: new mongoose.Types.ObjectId(commentInfo._postId),
    }).session(session);
    if (!post) throw Errors.PostNotFound;

    //Check parentComment is exist (if parentId is exist)
    if (commentInfo._parentId) {
      const parentComment = await Comments.findOne({
        $and: [
          { _id: new mongoose.Types.ObjectId(commentInfo._parentId) },
          { _status: 0 },
        ],
      }).session(session);
      if (!parentComment) throw Errors.CommentNotFound;
      parentId = parentComment._uId.toString();
    }

    //Upload images to firebase
    if (files.length > 0) {
      commentInfo._images = await this.imageService.uploadSocialImages(files);
      if (commentInfo._images.length <= 0) throw Errors.UploadImageFail;
    }

    //Create comment
    if (parentId !== "") {
      const newComment = await Comments.create(
        [
          {
            _uId: new mongoose.Types.ObjectId(commentInfo._uId),
            _postId: new mongoose.Types.ObjectId(commentInfo._postId),
            _parentId: new mongoose.Types.ObjectId(commentInfo._parentId),
            _content: commentInfo._content,
            _images: commentInfo._images,
          },
        ],
        { session }
      );

      if (newComment.length <= 0) throw Errors.SaveToDatabaseFail;
      comment = { ...newComment[0].toObject() };

      notification = CreateNotificationCommentDTO.fromService({
        _commentId: newComment[0]._id,
        _title: "Có người đã trả lời bình luận của bạn",
        _message: `Có người đã trả lời bình luận của bạn trong bài viết ${post._id}`,
        _uId: new mongoose.Types.ObjectId(parentId),
        _senderId: new mongoose.Types.ObjectId(commentInfo._uId),
        _postId: post._id,
        _type: "NEW_COMMENT",
      });
    } else {
      const newComment = await Comments.create(
        [
          {
            _uId: new mongoose.Types.ObjectId(commentInfo._uId),
            _postId: new mongoose.Types.ObjectId(commentInfo._postId),
            _content: commentInfo._content,
            _images: commentInfo._images,
          },
        ],
        { session }
      );

      if (newComment.length <= 0) throw Errors.SaveToDatabaseFail;
      comment = { ...newComment[0].toObject() };

      notification = CreateNotificationCommentDTO.fromService({
        _commentId: newComment[0]._id,
        _title: "Có người đã bình luận vào bài viết của bạn",
        _message: `Có người đã bình luận vào bài viết của bạn trong bài viết ${post._id}`,
        _uId: post._uId,
        _senderId: newComment[0]._uId,
        _postId: post._id,
        _type: "NEW_COMMENT",
      });
    }

    //Increase totalComment of SocialPost
    await SocialPosts.updateOne(
      { _id: post._id },
      { $inc: { _totalComment: 1 } }
    ).session(session);

    //Create notification
    const newNotification = await this.notificationService.createNotification(
      notification,
      session
    );
    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

    //Emit event "sendNotification"
    eventEmitter.emit("sendNotification", {
      ...newNotification[0],
      recipientRole: 0,
      recipientId: newNotification[0]._uId.toString(),
    });

    await session.commitTransaction();
    return comment;
  };

  //Update comment
  public updateComment = async (
    commentId: string,
    commentInfo: UpdateCommentDTO,
    files: Express.Multer.File[] | undefined,
    session: ClientSession
  ) => {
    let parentId: string = "";
    let images: string[] = [];
    let notification: CreateNotificationCommentDTO;
    //Check comment is exist
    const comment = await Comments.findOne({
      $and: [
        { _id: new mongoose.Types.ObjectId(commentId) },
        { _uId: new mongoose.Types.ObjectId(commentInfo._uId) },
        { _status: 0 },
      ],
    }).session(session);
    if (!comment) throw Errors.CommentNotFound;

    //Check post is exist
    const post = await SocialPosts.findOne({
      $and: [
        {
          _id: new mongoose.Types.ObjectId(comment._postId),
        },
        { _status: 0 },
      ],
    }).session(session);
    if (!post) throw Errors.PostNotFound;

    //Check parentComment is exist
    if (comment._parentId) {
      const parentComment = await Comments.findOne({
        $and: [{ _id: comment._parentId }, { _status: 0 }],
      }).session(session);
      if (!parentComment) throw Errors.CommentNotFound;
      parentId = parentComment._uId.toString();
    }

    //Check and delete images in _images of Comments
    if (commentInfo._deleteImages && commentInfo._deleteImages.length > 0) {
      const deleteArr = commentInfo._deleteImages.split(",");

      comment._images.forEach((image, index) => {
        if (!deleteArr.includes(index.toString())) {
          images.push(image as string);
        }
      });
    } else {
      images = [...comment._images] as string[];
    }

    //Check file images and upload to firebase
    if (files.length > 0) {
      if (images.length + files.length > 10) throw Errors.FileCountExceedLimit;
      //Upload images to firebase
      commentInfo._images = [
        ...images,
        ...(await this.imageService.uploadSocialImages(files)),
      ];
      if (commentInfo._images.length <= 0) throw Errors.UploadImageFail;
    } else {
      commentInfo._images = [...images];
    }

    const commentUpdated = await Comments.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(commentId),
      },
      {
        _content: commentInfo._content,
        _images: commentInfo._images,
      },
      { session, new: true }
    );

    //Check parentId to set notification
    if (parentId !== "") {
      notification = CreateNotificationCommentDTO.fromService({
        _commentId: new mongoose.Types.ObjectId(commentId),
        _title: `Người dùng ${commentUpdated._uId} đã thay đổi bình luận của họ`,
        _message: `Người dùng ${commentUpdated._uId} đã thay đổi bình luận của họ trong bài viết ${comment._postId}`,
        _uId: new mongoose.Types.ObjectId(parentId),
        _senderId: commentUpdated._uId,
        _postId: comment._postId,
        _type: "UPDATE_COMMENT",
      });
    } else {
      notification = CreateNotificationCommentDTO.fromService({
        _commentId: new mongoose.Types.ObjectId(commentId),
        _title: `Người dùng ${commentUpdated._uId} đã thay đổi bình luận của họ`,
        _message: `Người dùng ${commentUpdated._uId} đã thay đổi bình luận của họ trong bài viết ${comment._postId}`,
        _uId: post._uId,
        _senderId: commentUpdated._uId,
        _postId: comment._postId,
        _type: "UPDATE_COMMENT",
      });
    }

    //Create notification
    const newNotification = await this.notificationService.createNotification(
      notification,
      session
    );
    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

    //Emit event "sendNotification"
    eventEmitter.emit("sendNotification", {
      ...newNotification[0],
      recipientRole: 0,
      recipientId: newNotification[0]._uId.toString(),
    });

    await session.commitTransaction();
    return commentUpdated;
  };

  //Hide comment
  public hideComment = async (
    commentId: string,
    uId: string,
    session: ClientSession
  ) => {
    let totalHideComments = 1;
    //Check comment is exist
    const comment = await Comments.findOne({
      $and: [
        { _id: new mongoose.Types.ObjectId(commentId) },
        { _uId: new mongoose.Types.ObjectId(uId) },
        { _status: 0 },
      ],
    }).session(session);
    if (!comment) throw Errors.CommentNotFound;

    //Check social post is exist
    const post = await SocialPosts.findOne({
      $and: [{ _id: comment._postId }, { _status: 0 }],
    }).session(session);
    if (!post) throw Errors.PostNotFound;

    //Hide comment
    const commentHided = await Comments.findOneAndUpdate(
      {
        _id: comment._id,
      },
      {
        _status: 1,
      },
      { session, new: true }
    );
    if (commentHided._status !== 1) throw Errors.SaveToDatabaseFail;

    //Count child comments of comment
    if (!commentHided._parentId) {
      const childComment = await Comments.countDocuments({
        $and: [
          {
            _parentId: commentHided._id,
          },
          { _status: 0 },
        ],
      });

      if (childComment > 0) {
        totalHideComments = totalHideComments + childComment;

        //Hide child comments of comment
        const childHided = await Comments.updateMany(
          {
            $and: [
              {
                _parentId: commentHided._id,
              },
              { _status: 0 },
            ],
          },
          {
            _status: 1,
          },
          { session }
        );
        if (childHided.modifiedCount <= 0) throw Errors.SaveToDatabaseFail;
      }
    }

    //Decrease totalComment of SocialPost
    const postUpdated = await SocialPosts.findOneAndUpdate(
      { _id: post._id },
      { $inc: { _totalComment: -totalHideComments } },
      { session, new: true }
    );
    if (Number(postUpdated._totalComment) < 0) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return commentHided;
  };
}
