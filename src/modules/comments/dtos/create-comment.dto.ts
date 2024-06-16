import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { Request } from "express";

export class CreateCommentDTO {
  @Expose()
  _uId: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  _postId: string;

  @Expose()
  _parentId: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  _content: string;

  @Expose()
  _images: string[];

  static fromRequest = (req: Request) => {
    return plainToClass(CreateCommentDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
