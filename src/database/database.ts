import mongoose from "mongoose";

const DBconnect = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Kết nối database thành công!");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default DBconnect;
