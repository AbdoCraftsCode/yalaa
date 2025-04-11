


import mongoose, { Schema, Types, model } from "mongoose";

const postschema = new Schema({




    content: {

        type: String,
        required:function () {
            return this?.attachments?.length ? false : true;



        },
        minlength: 2,
        maxlength: 25000,
        trim: true
    },






    isDeleted: {

        type: Boolean,
        default: false

    },




    attachments: [{ secure_url: String, public_id: String }],
    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],
    share: [{ type: Types.ObjectId, ref: "User" }],
    userId: { type: Types.ObjectId, ref: "User", required: true },
    deletedBy: { type: Types.ObjectId, ref: "User",  },

    changecredintialTime: Date,







},






    { timestamps: true })

const Postmodel = mongoose.models.Post || model("Post", postschema)

export default Postmodel

