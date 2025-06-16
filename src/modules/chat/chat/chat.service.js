
import { asyncHandelr } from "../../../utlis/response/error.response.js";
import { successresponse } from "../../../utlis/response/success.response.js";
import * as dbservice from "../../../DB/dbservice.js"
import { ChatModel } from "../../../DB/models/chaatmodel.js";






 



export const findGroupChat = asyncHandelr(async (req, res, next) => {
    const chat = await ChatModel.findOne().populate([
        {
            path: "participants",
            select: "_id username"
        },
        {
            path: "messages.senderId",
            select: "_id username"
        }
    ]);

    if (!chat) {
        return successresponse(res, { messages: [] });
    }

    successresponse(res, {
        participants: chat.participants,
        messages: chat.messages
    });
});
