import { NextFunction, Request, Response } from "express";
import { Service } from "typedi";
import { Errors } from "../../helpers/handle-errors";
import multer from "multer";

@Service()
export class ImageMiddleWare {
  public checkUploadImages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (files.length > 10) throw Errors.FileCountExceedLimit;

      files.forEach((fi) => {
        if (fi.size > 1048576) throw Errors.FileSizeExceedLimit;
      });

      next();
    } catch (error) {
      next(error);
    }
  };

  public checkUploadAvatar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file as Express.Multer.File;

      if (file.size > 10485760) throw Errors.FileSizeExceedLimit;

      next();
    } catch (error) {
      next(error);
    }
  };

  private multerFilter = (req: Request, file: Express.Multer.File, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(Errors.FileIsNotImage, false);
    }
  };

  public upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: this.multerFilter,
  });
}
