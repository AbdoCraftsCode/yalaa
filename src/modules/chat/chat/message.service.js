import { ChatModel } from "../../../DB/models/chaatmodel.js";
// import { scketConnections } from "../../../DB/models/User.model.js";
import { authenticationSocket } from "../../../middlewere/auth.socket.middlewere.js";
import * as dbservice from "../../../DB/dbservice.js"
import { scketConnections } from "../../../DB/models/User.model.js";






export const sendMessage = (socket) => {
    return socket.on("sendMessage", async (messageData) => {
        const { data } = await authenticationSocket({ socket });

        if (!data.valid) {
            return socket.emit("socketErrorResponse", data);
        }

        const userId = data.user._id.toString();
        const { message } = messageData;

        // جلب الشات الجماعي الوحيد
        const chat = await ChatModel.findOne();

        // لو ما فيش شات جماعي، ننشئه أول مرة
        if (!chat) {
            await ChatModel.create({
                participants: [userId],
                messages: [{
                    message,
                    senderId: userId
                }]
            });
        } else {
            // تأكد إن المستخدم جزء من المشاركين
            if (!chat.participants.includes(userId)) {
                chat.participants.push(userId);
            }

            // أضف الرسالة
            chat.messages.push({ message, senderId: userId });
            await chat.save();
        }

        // بث الرسالة لكل المستخدمين في الشات
        for (const participantId of chat.participants) {
            if (participantId.toString() !== userId && scketConnections.has(participantId.toString())) {
                socket.to(scketConnections.get(participantId.toString())).emit("receiveMessage", {
                    message,
                    senderId: userId
                });
            }
        }

        socket.emit("successMessage", { message });
    });
};
