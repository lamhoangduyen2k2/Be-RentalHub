import express from 'express';
import Container from 'typedi';
import { ReactionController } from './reaction.controller';
import { AuthenMiddWare } from '../auth/auth.middleware';

const reactionRoute = express.Router();
const reactionController = Container.get(ReactionController);
const authMiddleware = Container.get(AuthenMiddWare);

//Customer
//React social post
reactionRoute.post('/react-social-post', authMiddleware.authorizedUser, reactionController.reactSocialPost);

export default reactionRoute;