import { Service } from "typedi";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { giveCurrentDateTime } from "../../helpers/ultil";

@Service()
export class ImageService {
  public uploadImage = async (files: Express.Multer.File[]) => {
    // Initialize Cloud Storage and get a reference to the service
    const dataImage = [];
    for await (const fi of files) {
      const storage = getStorage();

      const dateTime = giveCurrentDateTime();

      const storageRef = ref(
        storage,
        `postImg/${fi.originalname + "       " + dateTime}`
      );

      // Create file metadata including the content type
      const metadata = {
        contentType: fi.mimetype,
      };

      // Upload the file in the bucket storage
      const snapshot = await uploadBytesResumable(
        storageRef,
        fi.buffer,
        metadata
      );
      //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

      // Grab the public url
      const downloadURL = await getDownloadURL(snapshot.ref);

      // dataImage.push({
      //   name: fi.originalname,
      //   type: fi.mimetype,
      //   downloadURL: downloadURL,
      // });

      dataImage.push(downloadURL);
    }
    return dataImage;
  };

  public uploadAvatar = async (file: Express.Multer.File) => {
    // Initialize Cloud Storage and get a reference to the service
    const storage = getStorage();

    const dateTime = giveCurrentDateTime();

    const storageRef = ref(
      storage,
      `userImg/${file.originalname + "       " + dateTime}`
    );

    // Create file metadata including the content type
    const metadata = {
      contentType: file.mimetype,
    };

    // Upload the file in the bucket storage
    const snapshot = await uploadBytesResumable(
      storageRef,
      file.buffer,
      metadata
    );
    //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

    // Grab the public url
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  };
}
