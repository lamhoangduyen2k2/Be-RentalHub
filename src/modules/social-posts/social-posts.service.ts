import { Service } from "typedi";
import { CreateSocialPostDto } from "./dtos/create-social-post.dto";

@Service()
export class SocialPostsService {
    public createSocialPost = async (postInfo: CreateSocialPostDto) => {
         
    } 
}