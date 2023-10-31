import express from "express"
import multer from "multer"
import Container from "typedi"
import { ImageController } from "./image.controller"

const routerImg = express.Router()
const imgController = Container.get(ImageController)

const upload = multer({ storage: multer.memoryStorage() })

routerImg.post("/image", upload.array("filename"), imgController.uploadImage)

export default routerImg