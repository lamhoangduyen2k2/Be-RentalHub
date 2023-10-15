import express from "express"
import { PostsController } from "./posts.controller"
import { PostsService } from "./posts.service"
import { AuthenMiddWare } from "../auth/auth.middleware"
import { AuthService } from "../auth/auth.service"

const route = express.Router()
const postsController = new PostsController(new PostsService())
const authMiddleware = new AuthenMiddWare(new AuthService())

route.get('/', authMiddleware.authorizedUser, postsController.getAllPostsController)

export default route