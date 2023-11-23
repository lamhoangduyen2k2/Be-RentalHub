import { Inject, Service } from "typedi";
import { TagService } from "./tag.service";
import { NextFunction, Request, Response } from "express";
import { ResponseData } from "../../helpers/response";
import { BodyResquest } from "../../base/base.request";
import { TagCreateDTO } from "./dtos/tag-create.dto";

@Service()
export class TagController {
  constructor(@Inject() private tagService: TagService) {}

  public getAllTags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.tagService.getAllTags();

      res.json(new ResponseData(data, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ file: tag.controller.ts:16 ~ TagController ~ getAllTags= ~ error:",
        error
      );
      next(error);
    }
  };

  public createTag = async (
    req: BodyResquest<TagCreateDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforTag = TagCreateDTO.fromRequest(req);
      const newTag = await this.tagService.createTag(inforTag);

      res.json(new ResponseData(newTag, null, null));
    } catch (error) {
      console.log(
        "🚀 ~ file: tag.controller.ts:41 ~ TagController ~ error:",
        error
      );
      next(error);
    }
  };
}
