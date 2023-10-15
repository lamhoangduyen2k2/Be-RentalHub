import { Service } from "typedi";
import Posts from "./posts.model";

@Service()
export class PostsService {
  getAllPosts = async () => {
    const posts = await Posts.find({});
    
    return posts;
  };
}
