import { Router } from "express";
import { validation } from "../../middlewere/validation.middlewere.js";
import  * as validators from "../auth/auth.validate.js"
import { addQuestion, adduser, confirmOTP, createClass, generateShareLink, createFile, createImages, createSupject, getAllClasses, getAllImages, getAllRanks, GetFriendsList, getMyRank, Getprofiledata, getQuestionsByClassAndSubject, getSharedFile, getSubjectsByClass, getUserFiles, getUserRoleById, getUserStorageUsage, resendOTP, shareFile, signup, signupwithGmail, submitAnswer, incrementFileView, getShareLinkAnalytics, getUserAnalytics, updateProfile, getUserEarnings, deleteFile, updateFileName, withdrawEarnings, getWithdrawalHistory, getAllPromoters, getUserAnalyticsadmin, getUserEarningsadmin, getShareLinkAnalyticsadmin, getSharedFilesByUser, createCopyrightReport, getAllCopyrightReports, requestWithdrawal, getAllWithdrawals, saveFile } from "./service/regestration.service.js";
import { deleteUserById, forgetpassword,   login, loginwithGmail, refreshToken, resetpassword, toggleUserBanByOwner } from "./service/authontecation.service.js";
import { authentication } from "../../middlewere/authontcation.middlewere.js";
import { fileValidationTypes, uploadCloudFile } from "../../utlis/multer/cloud.multer.js";
import { findGroupChat } from "../chat/chat/chat.service.js";

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

routr.post(
    "/report",
    authentication(),
    uploadCloudFile([
        ...fileValidationTypes.image,
        ...fileValidationTypes.document,
        ...fileValidationTypes.video,
    ]).single("file"),
    createCopyrightReport
);




routr.post("/resendOTP", resendOTP)

routr.patch("/updateProfile", authentication(), updateProfile)
routr.delete("/deleteFile/:fileId", authentication(), deleteFile)
routr.patch("/updateFileName/:fileId", authentication(), updateFileName)
routr.get("/getUserEarnings", authentication(), getUserEarnings)

// routr.get('/share/:fileId', incrementFileView(), getSharedFile);

routr.post("/generateShareLink",authentication(), generateShareLink)

routr.get("/getShareLinkAnalytics", authentication(), getShareLinkAnalytics)

routr.get("/getUserAnalytics", authentication(), getUserAnalytics)
routr.get("/getUserRoleById/:_id", getUserRoleById)
routr.get("/getAllCopyrightReports", getAllCopyrightReports)

routr.get("/getSharedFile/:fileId", getSharedFile)

routr.get("/getAllWithdrawals", getAllWithdrawals)


routr.post("/addQuestion", addQuestion)
routr.post("/submitAnswer", authentication(), submitAnswer)
routr.post("/saveFile", authentication(), saveFile)
routr.post("/requestWithdrawal", authentication(), requestWithdrawal)

routr.get("/getMyRank", authentication(), getMyRank)
routr.get("/getUserFiles", authentication(), getUserFiles)
routr.get("/getUserStorageUsage", authentication(), getUserStorageUsage)
routr.get("/findGroupChat", authentication(), findGroupChat)
routr.get("/withdrawEarnings", authentication(), withdrawEarnings)


routr.get("/GetFriendsList", authentication(),GetFriendsList)
routr.post("/signupwithGmail", signupwithGmail)
routr.post("/adduser/:friendId", authentication(),adduser)
routr.post("/createClass", createClass)
routr.post("/createSupject", createSupject)
routr.post("/confirmOTP", confirmOTP)
routr.get("/Getprofiledata", authentication(), Getprofiledata)
routr.get("/getWithdrawalHistory", authentication(), getWithdrawalHistory)
routr.get("/getSharedFilesByUser", authentication(), getSharedFilesByUser)

routr.patch("/toggleUserBanByOwner/:userId", authentication(), toggleUserBanByOwner)
routr.delete("/deleteUserById/:userId", authentication(), deleteUserById)
routr.post("/login", login)
routr.post("/shareFile/:id", shareFile)

routr.post("/refreshToken",refreshToken)
routr.post("/forgetpassword", forgetpassword)
routr.post("/resetpassword", resetpassword)
routr.post("/loginwithGmail", loginwithGmail)
routr.get("/getAllImages", getAllImages)
routr.get("/getAllClasses", getAllClasses)
routr.get("/getAllRanks", getAllRanks)
routr.get("/getAllPromoters", getAllPromoters)
routr.get("/getUserAnalyticsadmin/:userId", getUserAnalyticsadmin)
routr.get("/getUserEarningsadmin/:userId", getUserEarningsadmin)
routr.get("/getShareLinkAnalyticsadmin/:userId", getShareLinkAnalyticsadmin)
routr.get("/getSharedFile/:uniqueId", getSharedFile)

routr.get("/getSubjectsByClass/:classId", getSubjectsByClass)
routr.post("/getQuestionsByClassAndSubject", getQuestionsByClassAndSubject)

export default routr



