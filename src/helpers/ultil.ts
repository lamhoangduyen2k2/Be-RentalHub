//UpCase funtion
export const UpCase = (paramStr: string): string => {
  if (paramStr === "_dob") {
    return paramStr.toUpperCase();
  }
  return `${paramStr.charAt(1).toUpperCase()}${paramStr.slice(2)}`;
};

//LowerCase
export const LowerCase = (paramStr: string): string => {
  return paramStr.toLowerCase();
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
