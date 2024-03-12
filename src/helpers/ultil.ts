import mongoose from "mongoose";
import dayjs from "dayjs";

//UpCase funtion
export const UpCase = (paramStr: string): string => {
  if (paramStr === "_dob") {
    return paramStr.toUpperCase().slice(1);
  }
  return `${paramStr.charAt(1).toUpperCase()}${paramStr.slice(2)}`;
};

//LowerCase
export const LowerCase = (paramStr: string): string => {
  return paramStr.toLowerCase();
};

//Convert String[] to ObjectId[]
export const convertToObjectIdArray = (arr: string[]) => {
  return arr.map((str) => new mongoose.Types.ObjectId(str));
};

//get Current Day
export const giveCurrentDateTime = () => {
  const today = new Date();
  const date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  const dateTime = date + " " + time;
  return dateTime;
};

//Convert UTC time to Hochiminh time
export const convertUTCtoLocal = (utcTime: Date) => {
  return dayjs.utc(utcTime).local().format('DD-MM-YYYY');
};
