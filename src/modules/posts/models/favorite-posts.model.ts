import mongoose, { Schema } from "mongoose";
import Users from "../../user/model/users.model";
import Posts from "./posts.model";

const favoritePostSchema = new mongoose.Schema({
  _uId: {
    type: Schema.Types.ObjectId,
    ref: Users,
  },
  _postIds: {
    type: [Schema.Types.ObjectId],
    ref: Posts,
  },
  _createdDate: {
    type: Date,
    default: Date.now(),
  },
  _updatedDate: {
    type: Date,
    default: Date.now(),
  },
});

const FavoritePosts = mongoose.model("favoritePosts", favoritePostSchema);
export default FavoritePosts;
