import { Router } from "express";
import * as validators from "../user/user.validation.js"
import { validation } from "../../middlewere/validation.middlewere.js";
import { authentication, authorization } from "../../middlewere/authontcation.middlewere.js";
import { coverimages, Getloginuseraccount, updateimage, updatepassword, Updateuseraccount, Getprofiledata, deleteProfileImage, deleteCoverImage, updateUsername, subscribeToPremium, createFolder, getUserFolders, createFile, getFolderFiles, deleteFolder, savetoken, getAllUsers, sendnotification, notifyall, deleteFcmToken, getUserNotifications, markAllAsRead, generateFolderShareLink, getSharedFolderContent } from "./service/profile.service.js";
import { fileValidationTypes, uploadCloudFile } from "../../utlis/multer/cloud.multer.js";

const router = Router()

router.post(
    '/createFile/:folderId',
    authentication(),
    uploadCloudFile([
        ...fileValidationTypes.image,
        ...fileValidationTypes.document,
        ...fileValidationTypes.video,
        // تم دمج zip ضمن document فلا داعي لها هنا
    ]).single('file'),
    createFile
);



router.get("/Getloginuseraccount", authentication(), Getloginuseraccount)
router.get("/getFolderFiles/:folderId", authentication(), getFolderFiles)
router.patch("/updateUsername", authentication(), updateUsername)
router.post("/createFolder", authentication(), createFolder)
router.post("/savetoken", savetoken)
router.post("/notifyall", notifyall)
router.post("/sendnotification", sendnotification)
router.post("/markAllAsRead", authentication(),markAllAsRead)
router.get("/getUserFolders", authentication(), getUserFolders)

router.get("/getUserNotifications", authentication(), getUserNotifications)
router.delete("/deleteFcmToken", authentication(), deleteFcmToken)
router.post("/generateFolderShareLink", authentication(), generateFolderShareLink)
router.get("/getSharedFolderContent/:folderId", getSharedFolderContent)
router.patch("/subscribeToPremium", authentication(), subscribeToPremium)
router.patch("/Updateuseraccount", authentication(), Updateuseraccount)
router.patch("/updatepassword", authentication(), updatepassword)
router.get("/Getprofiledata", authentication(), Getprofiledata)
router.get("/getAllUsers", getAllUsers)

router.delete("/deleteFolder/:folderId", authentication(), deleteFolder)

router.patch("/profile/coverimage", authentication(),
  
    uploadCloudFile(fileValidationTypes.image).array('image', 2),


    coverimages);


router.patch("/updateimage", authentication(),
   
    uploadCloudFile(fileValidationTypes.image).single('image')
    , updateimage);

router.delete("/deleteProfileImage", authentication(), deleteProfileImage)
router.delete("/deleteCoverImage", authentication(), deleteCoverImage)
export default router