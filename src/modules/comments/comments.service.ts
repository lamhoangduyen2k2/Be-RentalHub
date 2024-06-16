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

@Service()
export class CommentsService {
  constructor(@Inject() private notificationService: NotificationService) {}
  //Create comment
  public createComment = async (
    commentInfo: CreateCommentDTO,
    files: Express.Multer.File[],
    session: ClientSession
  ) => {
    let comment = {};
    let notification: CreateNotificationCommentDTO;
    //Check  user is exist
    const user = await Users.findOne({
      $and: [
        { _id: new mongoose.Types.ObjectId(commentInfo._uId) },
        { _role: 0 },
        { _active: true }
      ],
    }).session(session);
    if (!user) throw Errors.UserNotFound;

    //Check post is exist
    const post = await SocialPosts.findOne({
      _id: new mongoose.Types.ObjectId(commentInfo._postId),
    }).session(session);
    if (!post) throw Errors.PostNotFound;

    //Create comment
    if (commentInfo._parentId) {
      const newComment = await Comments.create(
        [
          {
            _uId: new mongoose.Types.ObjectId(commentInfo._uId),
            _postId: new mongoose.Types.ObjectId(commentInfo._postId),
            _parentId: new mongoose.Types.ObjectId(commentInfo._parentId),
            _content: commentInfo._content,
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
        _uId: post._uId,
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
}
