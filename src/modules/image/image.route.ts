import express from "express";
import Container from "typedi";
import { ImageController } from "./image.controller";
import { ImageMiddleWare } from "./image.middleware";

const routerImg = express.Router();
const imgController = Container.get(ImageController);
const imageMiddleWare = Container.get(ImageMiddleWare);

routerImg.post(
  "/image",
  imageMiddleWare.upload.array("_images"),
  imageMiddleWare.checkUploadImages,
  imgController.uploadImage
);

export default routerImg;
