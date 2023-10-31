import { Inject, Service } from "typedi";
import { ImageService } from "./image.service";
import { NextFunction, Request, Response } from "express";
import { ResponseData } from "../../helpers/response";

@Service()
export class ImageController {
  constructor(@Inject() private imgService: ImageService) {}

  public uploadImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const files = req.files as Express.Multer.File[];
      const imageInfo = await this.imgService.uploadImage(files);

      res.json(new ResponseData(imageInfo, null, null))
    } catch (error) {
        console.log(error)
        next(error)
    }
  };
}
