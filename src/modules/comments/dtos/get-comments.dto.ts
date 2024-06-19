import { Expose, Transform, plainToClass } from "class-transformer";
import mongoose from "mongoose";

export class GetParentCommentsDTO {
  @Expose()
  @Transform((value) => value.obj._id.toString())
  _id: mongoose.Types.ObjectId;

  @Expose()
  @Transform((value) => value.obj._postId.toString())
  _postId: mongoose.Types.ObjectId;

  @Expose()
  @Transform((value) => value.obj._uId.toString())
  _uId: mongoose.Types.ObjectId;

  @Expose()
  _name: string;

  @Expose()
  @Transform((value) => value.obj._parentId && value.obj._parentId.toString())
  _parentId: mongoose.Types.ObjectId;

  @Expose()
  @Transform((value) => value.obj._rootId && value.obj._rootId.toString())
  _rootId: mongoose.Types.ObjectId;

  @Expose()
  _content: string;

  @Expose()
  _images: string[];

  @Expose()
  _status: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  static toResponse(data: unknown) {
    return plainToClass(GetParentCommentsDTO, data, {
        excludeExtraneousValues: true,
    });
  }
}
