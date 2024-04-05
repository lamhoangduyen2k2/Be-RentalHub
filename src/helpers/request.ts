import { Errors } from "./handle-errors";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const fetchIDRecognition = async (image_base64: string) => {
  const data = new FormData();
  data.append("image_base64", image_base64);

  const resData: any = await fetch("https://api.fpt.ai/vision/idr/vnm/", {
    method: "POST",
    headers: {
      api_key: process.env.API_KEY_ID_RECOGNITION,
    },
    body: data,
  }).then((res) => res.json());

  if (!resData.data[0] && resData.errorCode > 0) {
    switch (resData.errorCode) {
      case 1:
        throw Errors.ParametersInvalid;
        break;
      case 2:
        throw Errors.CroppingFailed;
        break;
      case 3:
        throw Errors.IDCardNotFound;
        break;
      case 5:
        throw Errors.UrlRequestNotFound;
        break;
      case 6:
        throw Errors.UrlRequestCanNotOpen;
        break;
      case 7:
        throw Errors.ImageInvalid;
        break;
      case 8:
        throw Errors.BadData;
        break;
      case 9:
        throw Errors.StringBase64NotFound;
        break;
      case 10:
        throw Errors.StringBase64Invalid;
        break;
    }
  }

  return resData.data[0];
};
