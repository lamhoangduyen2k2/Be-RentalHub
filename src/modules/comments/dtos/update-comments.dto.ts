import { Exclude, Expose, plainToClass } from "class-transformer";
import { IsString, ValidateIf } from "class-validator";
import { Request } from "express";

export class UpdateCommentDTO {
    @Expose()
    _uId: string;
  
    @Exclude()
    _postId: string;
  
    @Exclude()
    _parentId: string;
  
    @ValidateIf((o: UpdateCommentDTO) => o._content !== undefined)
    @Expose()
    @IsString()
    _content: string;
  
    @Expose()
    _images: string[];

    @Expose()
    _deleteImages: string;

    @Exclude()
    _status: number;
  
    static fromRequest = (req: Request) => {
      return plainToClass(UpdateCommentDTO, req.body, {
        excludeExtraneousValues: true,
      });
    };
  }