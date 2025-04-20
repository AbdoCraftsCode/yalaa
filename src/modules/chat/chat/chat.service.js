
import { asyncHandelr } from "../../../utlis/response/error.response.js";
import { successresponse } from "../../../utlis/response/success.response.js";
import * as dbservice from "../../../DB/dbservice.js"
import { ChatModel } from "../../../DB/models/chaatmodel.js";






 



export const findonechat = asyncHandelr(async (req, res, next) => {
    const { destId } = req.params;

    try {
        const chat = await dbservice.findOneAndUpdate({
            model: ChatModel,
            filter: {
                $or: [
                    {
                        mainUser: req.user._id,
                        subpartisipant: destId,
                    },
                    {
                        mainUser: destId,
                        subpartisipant: req.user._id,
                    }
                ]
            },
            populate: [
                {
                    path: "mainUser",
                    select: "_id username" // تقليل بيانات mainUser
                },
                {
                    path: "subpartisipant",
                    select: "_id username" // تقليل بيانات subpartisipant
                },
                {
                    path: "messages.senderId",
                    select: "_id username" // تقليل بيانات senderId
                }
            ],
            select: "messages" // نرجّع بس حقل messages
        });

        // لو مافيش محادثة، رجّع array فاضي
        const messages = chat && chat.messages ? chat.messages : [];

        console.log('Messages found:', JSON.stringify(messages, null, 2));
        successresponse(res, { messages });
    } catch (error) {
        console.error('Error in findonechat:', error);
        next(error);
    }
});