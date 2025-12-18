import { Router } from "express";
import { validation } from "../../middlewere/validation.middlewere.js";
import  * as validators from "../auth/auth.validate.js"
import { addQuestion, adduser, confirmOTP, createClass, generateShareLink, createFile, createImages, createSupject, getAllClasses, getAllImages, getAllRanks, GetFriendsList, getMyRank, Getprofiledata, getQuestionsByClassAndSubject, getSharedFile, getSubjectsByClass, getUserFiles, getUserRoleById, getUserStorageUsage, resendOTP, shareFile, signup, signupwithGmail, submitAnswer, incrementFileView, getShareLinkAnalytics, getUserAnalytics, updateProfile, getUserEarnings, deleteFile, updateFileName, withdrawEarnings, getWithdrawalHistory, getAllPromoters, getUserAnalyticsadmin, getUserEarningsadmin, getShareLinkAnalyticsadmin, getSharedFilesByUser, createCopyrightReport, getAllCopyrightReports, requestWithdrawal, getAllWithdrawals, saveFile, createChannel, subscribeToChannel, getMySubscribedChannels, createFilechannel, getUserFileschannel, updateUserEarningsByOwner, toggleBrimumeByOwner, createSubscription, getAllSubscriptions, createPlan, getPlans, deletePlan, updatePlan, getAllStorageStats, updateWithdrawalStatus, getApprovedWithdrawals, updateSinglePendingReward, updateAnalyticsData, deleteCopyrightReport, getUserWithdrawals, getShareLinkAnalyticdownloads, createPaymentService, getPaymentServices, deletePaymentService, updatePaymentService } from "./service/regestration.service.js";
import { createZip, deleteUserById, downloadZip, forgetpassword,   getMyZips,   getUserStats,   login, loginwithGmail, refreshToken, resetpassword, toggleUserBanByOwner } from "./service/authontecation.service.js";
import { authentication } from "../../middlewere/authontcation.middlewere.js";
import { fileValidationTypes, uploadCloudFile } from "../../utlis/multer/cloud.multer.js";
import { findGroupChat } from "../chat/chat/chat.service.js";
import { getSharedItems } from "../user/service/profile.service.js";

const routr = Router()




routr.post("/signup", signup)

routr.get("/getAllStorageStats", getAllStorageStats)

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
    "/createSubscription",
    authentication(),
    uploadCloudFile(fileValidationTypes.image).single("invoice"), // اسم الحقل invoice
    createSubscription
);


routr.post(
    '/createFilechannel',
    authentication(),
    uploadCloudFile([
        ...fileValidationTypes.image,
        ...fileValidationTypes.document,
        ...fileValidationTypes.video,
        // تم دمج zip ضمن document فلا داعي لها هنا
    ]).single('file'),
    createFilechannel
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


routr.post(
    "/createChannel",
    authentication(),
    uploadCloudFile([
        ...fileValidationTypes.image,
        ...fileValidationTypes.document,
        ...fileValidationTypes.video,
    ]).single("file"),
    createChannel
);


routr.post(
    "/subscribeToChannel",
    authentication(),

    subscribeToChannel
);

routr.get(
    "/getMySubscribedChannels",
    authentication(),

    getMySubscribedChannels
);





routr.post("/resendOTP", resendOTP)

routr.get("/getUserStats", getUserStats)

routr.patch("/updateAnalyticsData/:id", updateAnalyticsData)

routr.get("/getApprovedWithdrawals", getApprovedWithdrawals)

routr.patch("/updateWithdrawalStatus/:id", updateWithdrawalStatus)
routr.patch("/updateSinglePendingReward/:analyticsId/:pendingId", updateSinglePendingReward)

routr.post("/createPlan", authentication(), createPlan)

routr.get("/getPlans", getPlans)

routr.delete("/deletePlan/:id", deletePlan)

routr.patch("/updatePlan/:id", updatePlan)



routr.get("/getAllSubscriptions", getAllSubscriptions)

routr.patch("/updateProfile", authentication(), updateProfile)
routr.delete("/deleteFile/:fileId", authentication(), deleteFile)

routr.get("/getShareLinkAnalyticdownloads/:userId", authentication(), getShareLinkAnalyticdownloads)

routr.get("/getUserWithdrawals", authentication(), getUserWithdrawals)

routr.delete("/deleteCopyrightReport/:reportId", authentication(), deleteCopyrightReport)

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
routr.delete("/deletePaymentService/:id", deletePaymentService)

routr.patch("/updatePaymentService/:id", updatePaymentService)

routr.get("/getPaymentServices", getPaymentServices)
routr.get("/getMyZips", authentication(), getMyZips)

routr.post("/downloadZip/:zipId", authentication(), downloadZip)

routr.post("/createPaymentService", createPaymentService)

routr.post("/submitAnswer", authentication(), submitAnswer)
routr.post("/createZip", authentication(), createZip)

routr.post("/saveFile", authentication(), saveFile)


routr.post("/requestWithdrawal", authentication(), requestWithdrawal)

routr.patch("/updateUserEarningsByOwner/:userId", authentication(), updateUserEarningsByOwner)

routr.patch("/toggleBrimumeByOwner/:userId", authentication(), toggleBrimumeByOwner)



routr.get("/getMyRank", authentication(), getMyRank)
routr.get("/getUserFiles", authentication(), getUserFiles)

routr.get("/getSharedItems",  getSharedItems)

routr.get("/getUserFileschannel",  getUserFileschannel)

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



