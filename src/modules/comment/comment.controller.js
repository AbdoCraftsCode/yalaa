import { Router } from "express";
import { createComment, freezcomment, getcomments, likecomment, restorecomment, updateComment } from "./service/comment.service.js";
import { authentication, authorization } from "../../middlewere/authontcation.middlewere.js";
import { fileValidationTypes, uploadCloudFile } from "../../utlis/multer/cloud.multer.js";
import { endpoint } from "./comment.authrization.js";
const router = Router({mergeParams:true})

router.post("/create",
    authentication(),
    authorization(endpoint.create),
uploadCloudFile(fileValidationTypes.image).array("attachments",2),
    createComment
)
router.patch("/update/:commentId",
    authentication(),
    authorization(endpoint.create),
    uploadCloudFile(fileValidationTypes.image).array("attachments", 2),
    updateComment
)
router.delete("/freezcomment/:commentId",
    authentication(),
    authorization(endpoint.freez),
   
    freezcomment
)
router.patch("/restorecomment/:commentId",
    authentication(),
    authorization(endpoint.freez),

   restorecomment
)
router.get("/comment",


getcomments
)
router.post("/:commentId",
    authentication(),

    likecomment
)




export default router