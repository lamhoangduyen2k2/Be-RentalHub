import { Exclude, Expose, Transform, plainToClass } from "class-transformer";
import mongoose from "mongoose";

export class CreateNotificationCommentDTO {
    @Expose()
    @Transform((value) => value.obj._commentId.toString())
    _commentId: mongoose.Types.ObjectId;

    @Expose()
    @Transform((value) => value.obj._rootId && value.obj._rootId.toString())
    _rootId: mongoose.Types.ObjectId;
    
    @Expose()
    @Transform((value) => value.obj._uId.toString())
    _uId: mongoose.Types.ObjectId;

    @Expose()
    @Transform((value) => value.obj._postId.toString())
    _postId: mongoose.Types.ObjectId;

    @Expose()
    @Transform((value) => value.obj._senderId.toString())
    _senderId: mongoose.Types.ObjectId;

    @Expose()
    _title: string;

    @Expose()
    _message: string;

    @Exclude()
    _read: boolean;

    @Expose()
    _type: string;

    static fromService(data: unknown) {
        return plainToClass(CreateNotificationCommentDTO, data, {
            excludeExtraneousValues: true,
        });
    }
}