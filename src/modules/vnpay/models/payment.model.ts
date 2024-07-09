import mongoose, { Schema } from "mongoose";
import Users from "../../user/model/users.model";

const typePackage = ["VIP20", "VIP50", "GOD", "Cơ bản"];

const paymentSchema = new mongoose.Schema(
  {
    _orderId: {
      type: String,
      unique: true,
      required: [true, "Order ID is required"],
    },
    _amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    _uId: {
      type: Schema.Types.ObjectId,
      ref: Users,
      required: [true, "User ID is required"],
    },
    _type: {
      type: String,
      enum: typePackage,
      default: typePackage[3],
    },
  },
  {
    timestamps: true,
  }
);

const Payments = mongoose.model("payments", paymentSchema);
export default Payments;
