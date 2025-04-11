import { asyncHandelr } from "../../../utlis/response/error.response.js";
import { successresponse } from "../../../utlis/response/success.response.js";
import * as dbservice from "../../../DB/dbservice.js"
import Postmodel from "../../../DB/models/Post.model.js";
import Commentmodel from "../../../DB/models/comment.model.js";
import cloud from "../../../utlis/multer/cloudinary.js"
import { roletypes } from "../../../DB/models/User.model.js";

export const createComment = asyncHandelr(
    async (req, res, next) => {
        const { postId } = req.params;
            
        console.log({ postId })
        
        const post = await dbservice.findOne(
            {
                model: Postmodel,
                filter: {
                    _id: postId,
                    isDeleted: false

                }
            }
        )

        if (!post) {
            
            return next(new Error("not found post", { cause: 404 }))
        }

        let attachments = [];

        if (req.files) {
            for (const file of req.files) {
                const { secure_url, public_id } = await cloud.uploader.upload(file.path, { folder: `${process.env.APP_NAM}/user/${post.userId}/post/comment` });
                attachments.push({ secure_url, public_id });
            }
            req.body.attachments = attachments;
        }

        const comment = await dbservice.create({
            model: Commentmodel,
            data: {
                ...req.body,
                userId: req.user._id,
                postId: postId,
            },
        });
        
        return successresponse(res, { comment })


    }
);


export const updateComment = asyncHandelr(async (req, res, next) => {
    const { postId, commentId } = req.params;


    const comment = await dbservice.findOne({
        model: Commentmodel,
        filter: {
            _id: commentId,
            postId,
            isDeleted: false
        },
        populate: [{
            path: "postId",
            select: "isDeleted content"
        }]
    });
    console.log(comment);



    if (!comment) {
        return next(new Error("invalid-comment", { cause: 404 }));
    }


    const post = await dbservice.findOne({
        model: Postmodel,
        filter: {
            _id: postId,
            isDeleted: false
        }
    });

    if (!post) {
        return next(new Error("invalid-post", { cause: 404 }));
    }

    let attachments = comment.attachments || []; 

  
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const { secure_url, public_id } = await cloud.uploader.upload(file.path, {
                folder: `${process.env.APP_NAM}/user/${comment.userId}/post/comment`
            });
            attachments.push({ secure_url, public_id });
        }
    }

 
    const savedcomment = await dbservice.findOneAndUpdate({
        model: Commentmodel,
        filter: {
            _id: commentId,
            postId,
            isDeleted: false
        },
        data: {
            ...req.body,
            attachments 
        },
        options: {
            new: true
        }
    });

    return successresponse(res, { savedcomment });

});

export const freezcomment = asyncHandelr(async (req, res, next) => {
    const { postId, commentId } = req.params;

    const comment = await dbservice.findOne({
        model: Commentmodel,
        filter: {
            _id: commentId,
            postId,
            isDeleted: false
        },
        populate: "postId" 
    });

    if (!comment) {
        return next(new Error("invalid-comment", { cause: 404 }));
    }

   
    if (
        req.user._id.toString() !== comment.userId.toString() &&
        comment.postId.userId.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
    ) {
        return next(new Error("Unauthorized: You cannot freeze this comment", { cause: 403 }));
    }

    const savedcomment = await dbservice.findOneAndUpdate({
        model: Commentmodel,
        filter: { _id: commentId, postId, isDeleted: false },
        data: {
            isDeleted: true ,
            deletedBy:req.user._id
        }, 
        options: {
            new: true
        }

    });

    return successresponse(res, { savedcomment });
});


export const restorecomment = asyncHandelr(async (req, res, next) => {
    const { postId, commentId } = req.params;

  

    const savedcomment = await dbservice.findOneAndUpdate({
        model: Commentmodel,
        filter: {
            _id: commentId,
        
            isDeleted: true,
            deletedBy:req.user._id
        },
        data: {
            isDeleted: false,
            $unset: {
                
                deletedBy: req.user._id
            },
            },
          
        options: {
            new: true
        }

    });

    return successresponse(res, { savedcomment });
});

export const getcomments = asyncHandelr(async (req, res, next) => {





    const comments = await dbservice.findAll({
        model: Commentmodel,
        data: {

            isDeleted: false
        },
        select: "content -_id", 
        populate: [
            { path: "userId", select: "username profilePic -_id" },
            { path: "likes", select: "username profilePic" },
            { path: "share", select: "username profilePic" },
                 { path: "tags", select: "username profilePic" }
        ]
    });

    if (!comments) {
        return next(new Error("invalid posts", { cause: 404 }));
    }

    return successresponse(res, { comments });
});


export const likecomment = asyncHandelr(async (req, res, next) => {
    console.log("User data:", req.user); // ✅ تأ
    const { commentId } = req.params;
    const { action } = req.query;

    if (!commentId) {
        return next(new Error("Comment ID is required", { cause: 400 }));
    }

    const updateQuery = action?.toLowerCase() === 'unlike'
        ? { $pull: { likes: req.user._id } }
        : { $addToSet: { likes: req.user._id } };

    const comment = await dbservice.findOneAndUpdate({
        model: Commentmodel,
        filter: {
            _id: commentId,
            isDeleted: false
        },
        data: updateQuery,
        options: {
            new: true
        }
    });

    if (!comment) {
        return next(new Error("Invalid comment or already deleted", { cause: 404 }));
    }

    return successresponse(res, "Comment updated successfully", 200, { comment });
});


 

