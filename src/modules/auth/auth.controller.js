import { Router } from "express";
import { validation } from "../../middlewere/validation.middlewere.js";
import  * as validators from "../auth/auth.validate.js"
import { confirmOTP, createClass, createImages, getAllClasses, getAllImages, Getprofiledata, signup, signupwithGmail } from "./service/regestration.service.js";
import { forgetpassword,   login, loginwithGmail, refreshToken, resetpassword } from "./service/authontecation.service.js";
import { authentication } from "../../middlewere/authontcation.middlewere.js";
import { fileValidationTypes, uploadCloudFile } from "../../utlis/multer/cloud.multer.js";

const routr = Router()




routr.post("/signup", signup)

routr.post("/createImages",
   
  
    uploadCloudFile(fileValidationTypes.image).single("image"),
    createImages
)


routr.post("/signupwithGmail", signupwithGmail)
routr.post("/createClass", createClass)
routr.post("/confirmOTP", confirmOTP)
routr.get("/Getprofiledata",authentication() ,Getprofiledata)
routr.post("/login",login)
routr.post("/refreshToken",refreshToken)
routr.post("/forgetpassword", forgetpassword)
routr.post("/resetpassword", resetpassword)
routr.post("/loginwithGmail", loginwithGmail)
routr.get("/getAllImages", getAllImages)
routr.get("/getAllClasses", getAllClasses)
export default routr