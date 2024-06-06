/* eslint-disable @typescript-eslint/no-explicit-any */
// import { Server, Socket } from "socket.io";
// import { Server as HttpServer} from "http";
import { EventEmitter } from "events";

// //List of online users
// let onlineUsers: { userId: string; socketId: string }[] = [];
// let onlineInspectors: { userId: string; socketId: string }[] = [];
// const onlineAdmins = {
//   userId: "65418310bec0ba49c4d9a276",
//   socketId: "",
// };

// let io : Server;
class MyEmitter extends EventEmitter {}
const eventEmitter = new MyEmitter();

export default eventEmitter;

// export const initSocket = (server: HttpServer, corsOptions: any) : Server => {
  
//   io = new Server(server, { cors: corsOptions });

//   io.on("connection", (socket: Socket) => {
//     console.log("New connection: ", socket.id);

//     //listen to a connection
//     socket.on("addNewUser", (user) => {
//       if (user.userId === onlineAdmins.userId) {
//         //Add admin to online of Users
//         !onlineUsers.some((u) => u.userId === user.userId) &&
//           onlineUsers.push({
//             userId: user.userId,
//             socketId: socket.id,
//           });

//         //Add admin to online of Inspectors
//         !onlineInspectors.some((u) => u.userId === user.userId) &&
//           onlineInspectors.push({
//             userId: user.userId,
//             socketId: socket.id,
//           });
//       } else if (user.role === 0) {
//         !onlineUsers.some((u) => u.userId === user.userId) &&
//           onlineUsers.push({
//             userId: user.userId,
//             socketId: socket.id,
//           });
//       } else {
//         if (user.userId === onlineAdmins.userId)
//           onlineAdmins.socketId = socket.id;
//         !onlineInspectors.some((u) => u.userId === user.userId) &&
//           onlineInspectors.push({
//             userId: user.userId,
//             socketId: socket.id,
//           });
//       }
//       //Get users online list for customer
//       io.emit("getOnlineUsers", onlineUsers);
//       console.log("🚀 ~ socket.on ~ onlineUsers:", onlineUsers)
//       //Get admin online for user
//       //io.emit("getOnlineAdmin", onlineAdmins);
//     });

//     //add message
//     socket.on("sendMessage", (message) => {
//       const recipient = onlineUsers.find(
//         (user) => user.userId === message.recipientId
//       );
      
//       if (recipient) {
//         console.log("🚀 ~ socket.on ~ message:", message)
//         io.to(recipient.socketId).emit("getMessage", message);
//         io.to(recipient.socketId).emit("getUnreadMessage", {
//           chatId: message.chatId,
//           isRead: false,
//           date: new Date(),
//         });
//       }
//     });

//     //send notifications
//     eventEmitter.on("sendNotification", (notification) => {
//       console.log("🚀 ~ socket.on ~ notification:", notification._doc)
//       if (notification._doc.recipientRole === 2) {
//         // Send notification for all inspectors
//         onlineInspectors.forEach((inspector) => {
//           io.to(inspector.socketId).emit("getNotification", notification._doc);
//         });
//       } else if (notification.recipientRole === 0) {
//         // Send notification for a specific user
//         const recipient = onlineUsers.find(
//           (user) => user.userId === notification._doc.recipientId
//         );
//         if (recipient) {
//           io.to(recipient.socketId).emit("getNotification", notification._doc);
//         }
//       }
//     });

//     socket.on("disconnect", () => {
//       onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
//       onlineInspectors = onlineInspectors.filter(
//         (user) => user.socketId !== socket.id
//       );
//       io.emit("getOnlineUsers", onlineUsers);
//       //io.emit("getOnlineInspectors", onlineInspectors);
//     });
//   });

//   return io;
// };

// export const getIo = () : Server => {
//   if (!io) {
//     throw new Error("Socket.io not initialized");
//   }
//   return io;
// };


