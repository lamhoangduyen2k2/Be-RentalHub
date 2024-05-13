import { Service } from "typedi";
import chatModel from "./chat.model";

@Service()
export class ChatService {
  public createChat = async (firstId: string, secondId: string) => {
    // Check chat is already exist
    const chat = await chatModel.findOne({
      members: { $all: [firstId, secondId] },
    });

    if (chat) return chat;

    // Create new chat
    const newChat = await chatModel.create({
      members: [firstId, secondId],
    });

    return newChat;
  };

  public findUserChats = async (userId: string) => {
    const chats = await chatModel.find({ members: { $in: [userId] } });
    return chats;
  };

  public findChat = async (firstId: string, secondId: string) => {
    const chat = await chatModel.findOne({
      members: { $all: [firstId, secondId] },
    });

    return chat;
  };
}
