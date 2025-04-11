import { Router } from "express";
import { authentication, authorization } from "../../middlewere/authontcation.middlewere.js";
import { roletypes } from "../../DB/models/User.model.js";
import { endpoint } from "./post.authrization.js";
import { fileValidationTypes, uploadCloudFile } from "../../utlis/multer/cloud.multer.js";
import { createPost, frezePost, getPosts, likePost, restorePost, updatePost } from "./service/post.service.js";
import commentcontroller from "../../modules/comment/comment.controller.js"

const router = Router()


router.use("/:postId/comment", commentcontroller)
router.post("/", authentication(),
    
    authorization(endpoint.createPost),
    uploadCloudFile(fileValidationTypes.image  ).array("image", 2),
createPost

),
    router.patch("/:postId", authentication(),

        authorization(endpoint.createPost),
        uploadCloudFile(fileValidationTypes.image).array("image", 2),
        updatePost

    )
router.delete("/:postId", authentication(),

    authorization(endpoint.freezpost),
  
   frezePost

),
    router.patch("/restore/:postId", authentication(),

        authorization(endpoint.freezpost),

        restorePost

    )
router.patch("/likepost/:postId", authentication(),

    authorization(endpoint.likePost),

    likePost

)
router.get("/allposts", 

   

    getPosts

)



export default router