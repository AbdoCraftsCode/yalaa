import { Router } from "express";
import { validation } from "../../middlewere/validation.middlewere.js";
import  * as validators from "../auth/auth.validate.js"
import { addQuestion, adduser, confirmOTP, createClass, generateShareLink,createFile, createImages, createSupject, getAllClasses, getAllImages, getAllRanks, GetFriendsList, getMyRank, Getprofiledata, getQuestionsByClassAndSubject, getSharedFile, getSubjectsByClass, getUserFiles, getUserRoleById, getUserStorageUsage, resendOTP, shareFile, signup, signupwithGmail, submitAnswer, incrementFileView, getShareLinkAnalytics, getUserAnalytics } from "./service/regestration.service.js";
import { forgetpassword,   login, loginwithGmail, refreshToken, resetpassword } from "./service/authontecation.service.js";
import { authentication } from "../../middlewere/authontcation.middlewere.js";
import { fileValidationTypes, uploadCloudFile } from "../../utlis/multer/cloud.multer.js";
import { findonechat } from "../chat/chat/chat.service.js";

const routr = Router()




routr.post("/signup", signup)

routr.post("/createImages",
   
  
    uploadCloudFile(fileValidationTypes.image).single("image"),
    createImages
)
routr.post(
    '/createFile',
    authentication(),
    uploadCloudFile([
        ...fileValidationTypes.image,
        ...fileValidationTypes.document,
        ...fileValidationTypes.video,
        // تم دمج zip ضمن document فلا داعي لها هنا
    ]).single('file'),
    createFile
);

routr.post("/resendOTP", resendOTP)
// routr.get('/share/:fileId', incrementFileView(), getSharedFile);

routr.post("/generateShareLink",authentication(), generateShareLink)

routr.get("/getShareLinkAnalytics", authentication(), getShareLinkAnalytics)

routr.get("/getUserAnalytics", authentication(), getUserAnalytics)
routr.get("/getUserRoleById/:_id", getUserRoleById)
routr.get("/getSharedFile/:fileId", incrementFileView,getSharedFile)
routr.post("/addQuestion", addQuestion)
routr.post("/submitAnswer", authentication(), submitAnswer)
routr.get("/getMyRank", authentication(), getMyRank)
routr.get("/getUserFiles", authentication(), getUserFiles)
routr.get("/getUserStorageUsage", authentication(), getUserStorageUsage)
routr.get("/findonechat/:destId", authentication(), findonechat)
routr.get("/GetFriendsList", authentication(),GetFriendsList)
routr.post("/signupwithGmail", signupwithGmail)
routr.post("/adduser/:friendId", authentication(),adduser)
routr.post("/createClass", createClass)
routr.post("/createSupject", createSupject)
routr.post("/confirmOTP", confirmOTP)
routr.get("/Getprofiledata",authentication() ,Getprofiledata)
routr.post("/login", login)
routr.post("/shareFile/:id", shareFile)

routr.post("/refreshToken",refreshToken)
routr.post("/forgetpassword", forgetpassword)
routr.post("/resetpassword", resetpassword)
routr.post("/loginwithGmail", loginwithGmail)
routr.get("/getAllImages", getAllImages)
routr.get("/getAllClasses", getAllClasses)
routr.get("/getAllRanks", getAllRanks)
routr.get("/getSharedFile/:uniqueId", getSharedFile)
routr.get("/getSubjectsByClass/:classId", getSubjectsByClass)
routr.post("/getQuestionsByClassAndSubject", getQuestionsByClassAndSubject)

export default routr



