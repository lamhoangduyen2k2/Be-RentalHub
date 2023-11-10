import mongoose, { Schema } from "mongoose";
import Users from "../user/users.model";
import Tags from "../tags/tag.model";

const roomSchema = new mongoose.Schema({
  _uId: {
    type: Schema.Types.ObjectId,
    ref: Users,
  },
  _street: {
    type: String,
    required: [true, "Street is required"],
    trim: true,
  },
  _district: {
    type: Schema.Types.ObjectId,
    ref: Tags,
    required: [true, "District is required"],
  },
  _city: {
    type: String,
    trim: true,
    default: "Thành phố Hồ Chí Minh",
  },
  // _address: {
  //   type: String,
  //   required: [true, "Address is required"],
  //   trim: true,
  // },
  _services: {
    type: [String],
    default: null,
  },
  _utilities: {
    type: [String],
    default: null,
  },
  _area: {
    type: Number,
    required: [true, "Area is required!"],
  },
  _price: {
    type: Number,
    required: [true, "Price is required!"],
  },
  _electricPrice: {
    type: Number,
    required: [true, "Electric price is required!"],
  },
  _waterPrice: {
    type: Number,
    required: [true, "Water price is required!"],
  },
  _isRented: {
    type: Boolean,
    required: [true, "isRented is required!"],
    default: false,
  },
});

const Rooms = mongoose.model("rooms", roomSchema);
export default Rooms;
