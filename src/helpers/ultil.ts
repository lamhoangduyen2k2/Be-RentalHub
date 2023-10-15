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
