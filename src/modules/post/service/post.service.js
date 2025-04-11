import { asyncHandelr } from "../../../utlis/response/error.response.js";
import * as dbservice from "../../../DB/dbservice.js"
import Postmodel from "../../../DB/models/Post.model.js";
import cloud from "../../../utlis/multer/cloudinary.js"
import { successresponse } from "../../../utlis/response/success.response.js";
import { roletypes } from "../../../DB/models/User.model.js";
export const createPost = asyncHandelr(async (req, res, next) => {



    let attachments = [];

    if (req.files) {
        for (const file of req.files) {
            const { secure_url, public_id } = await cloud.uploader.upload(file.path, { folder: "post" });
            attachments.push({ secure_url, public_id });
        }
        req.body.attachments = attachments;
    }

    const post = await dbservice.create({
        model: Postmodel,
        data: {
            ...req.body,
            userId: req.user._id,
        },
    });

    return successresponse(res, { post });
});

export const updatePost = asyncHandelr(async (req, res, next) => {
    const { postId } = req.params;
    let attachments = [];

    if (req.files?.length) {
        try {
            for (const file of req.files) {
                const { secure_url, public_id } = await cloud.uploader.upload(file.path, { folder: "post" });
                attachments.push({ secure_url, public_id });
            }
            req.body.attachments = attachments;
        } catch (error) {
            return next(new Error("Error uploading files", { cause: 500 }));
        }
    }

    const post = await dbservice.findOneAndUpdate({
        model: Postmodel,
        filter: {
            _id: postId,
            userId: req.user._id,
            isDeleted: false
        },
        data: {
            ...req.body,
        },
        options: { new: true }
    });
    console.log("Post updated by user:", req.user._id);
    if (!post) {
        return next(new Error("Invalid post", { cause: 404 }));
    }


    return successresponse(res, { post });
});



export const frezePost = asyncHandelr(async (req, res, next) => {

    const { postId } = req.params
    const owner = req.user.role === roletypes.Admin ? {} : { userId: req.user._id, }

    const post = await dbservice.findOneAndUpdate({
        model: Postmodel,
        filter: {

            _id: postId,
            ...owner,
            isDeleted: false
        },

        data: {
            isDeleted: true,
            deletedBy: req.user._id,

        },
        options: {

            new: true
        }

    });

    if (!post) {
        return next(new Error("invalid post", { cause: 404 }));

    }

    return successresponse(res, { post });
});


export const restorePost = asyncHandelr(async (req, res, next) => {

    const { postId } = req.params


    const post = await dbservice.findOneAndUpdate({
        model: Postmodel,
        filter: {

            _id: postId,
            deletedBy: req.user._id,
            isDeleted: true
        },

        data: {
            isDeleted: false,
            $unset: {

                deletedBy: req.user._id,
            }


        },
        options: {

            new: true
        }

    });

    if (!post) {
        return next(new Error("invalid post", { cause: 404 }));

    }

    return successresponse(res, { post });
});


export const likePost = asyncHandelr(async (req, res, next) => {
    const { postId } = req.params;
    const { action } = req.query;


    const data = action?.toLowerCase() === 'unlike'
        ? { $pull: { likes: req.user._id } }
        : { $addToSet: { likes: req.user._id } };
    console.log(action, data);

    const post = await dbservice.findOneAndUpdate({
        model: Postmodel,
        filter: {
            _id: postId,
            isDeleted: false
        },
        data,  // ✅ تم تصحيح التمرير هنا
        options: {
            new: true
        }
    });

    if (!post) {
        return next(new Error("invalid post", { cause: 404 }));
    }

    return successresponse(res, { post });
});

export const getPosts = asyncHandelr(async (req, res, next) => {





    const posts = await dbservice.findAll({
        model: Postmodel,
        data: {

            isDeleted: false
        },
        populate: [
            { path: "userId", select: "username profilePic email" },
            { path: "likes", select: "username profilePic" },
            { path: "share", select: "username profilePic" },
                 { path: "tags", select: "username profilePic" }
        ]
    });

    if (!posts) {
        return next(new Error("invalid posts", { cause: 404 }));
    }

    return successresponse(res, { posts });
});



