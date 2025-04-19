import { ChatModel } from "../../../DB/models/chaatmodel.js";
// import { scketConnections } from "../../../DB/models/User.model.js";
import { authenticationSocket } from "../../../middlewere/auth.socket.middlewere.js";
import * as dbservice from "../../../DB/dbservice.js"
import { scketConnections } from "../../../DB/models/User.model.js";






export const sendMessage = (socket) => {
    return socket.on("sendMessage", async (messageData) => {
        const { data } = await authenticationSocket({ socket });
        console.log(data);

        if (!data.valid) {
            return socket.emit("socketErrorResponse", data);
        }

        const userId = data.user._id.toString();
        const { destId, message } = messageData;

        const chat = await dbservice.findOneAndUpdate({
            model: ChatModel,
            filter: {
                $or: [
                    { mainUser: userId, subpartisipant: destId },
                    { mainUser: destId, subpartisipant: userId }
                ]
            },
            data: {
                $push: {
                    messages: {
                        message,
                        senderId: userId
                    }
                }
            }
        });

        if (!chat) {
            await dbservice.create({
                model: ChatModel,
                data: {
                    mainUser: userId,
                    subpartisipant: destId,
                    messages: [
                        {
                            message,
                            senderId: userId
                        }
                    ]
                }
            });
        }

        socket.emit("successMessage", { message });
        socket.to(scketConnections.get(destId)).emit("receiveMessage", { message });

        return "done";
    });
};