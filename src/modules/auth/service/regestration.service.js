import { asyncHandelr } from "../../../utlis/response/error.response.js";
import { Emailevent } from "../../../utlis/events/email.emit.js";
import *as dbservice from "../../../DB/dbservice.js"
import Usermodel, { providerTypes, roletypes } from "../../../DB/models/User.model.js";
import { comparehash, encryptData, generatehash } from "../../../utlis/security/hash.security.js";
import { successresponse } from "../../../utlis/response/success.response.js";
import { OAuth2Client } from "google-auth-library";
import { generatetoken } from "../../../utlis/security/Token.security.js";
import cloud from "../../../utlis/multer/cloudinary.js"
import { ImageModel } from "../../../DB/models/images.model.js";
import { ClassModel } from "../../../DB/models/Company.model.js";
// export const signup = asyncHandelr(async (req, res, next) => {
    
//     const { username, email, confirmationpassword, DOB, password, mobileNumber } = req.body

//     const checkuser = await dbservice.findOne({
    
//         model: Usermodel,
//         filter:{email}
//     })
//     if (checkuser) {
        
//         return next(new Error("email already exist" ,{cause:400}))
//     }

//     if (password !== confirmationpassword) {
//         return next(new Error("Passwords do not match tmm", { cause: 400 }));
//     }

//     const hashpassword = generatehash({ planText: password })
//     const encryptedPhone = encryptData(mobileNumber, process.env.CRYPTO_SECRET_KEY);
//     const user = await dbservice.create({
//         model: Usermodel,
//         data: { username, password: hashpassword, email, DOB, mobileNumber: encryptedPhone }

//     })
 
//     Emailevent.emit("confirmemail", { email });

//     return successresponse(res, "User created successfully", 201, { user });


// })

export const signup = asyncHandelr(async (req, res, next) => {
    const { username, email, classId, password, confirmationpassword, image, gender,  } = req.body;
    console.log(username, email, password);

    const checkUser = await dbservice.findOne({ model: Usermodel, filter: { email } });
    if (checkUser) {
        return next(new Error("email already exists", { cause: 404 }));
    }

    if (password !== confirmationpassword) {
        return next(new Error("Passwords do not match", { cause: 400 }));
    }

    let userId;
    let isUnique = false;
    while (!isUnique) {
        userId = Math.floor(1000000 + Math.random() * 9000000);

        const existingUser = await dbservice.findOne({ model: Usermodel, filter: { userId } });
        if (!existingUser && userId !== null) isUnique = true;
    }

    if (!userId) {
        return next(new Error("Failed to generate a unique userId", { cause: 500 }));
    }


    const hashPassword = generatehash({ planText: password });


    const user = await dbservice.create({
        model: Usermodel,
        data: { username, email, password: hashPassword, userId, image, gender, classId }
    });


    Emailevent.emit("confirmemail", { email });

    return successresponse(res, "User created successfully", 201, );
});

export const confirmOTP = asyncHandelr(
    async (req, res, next) => {
        const { code, email } = req.body;


        const user = await dbservice.findOne({ model: Usermodel, filter: { email } })
        if (!user) {
            return next(new Error("Email does not exist tmm", { cause: 404 }));
        }

     
        if (user.blockUntil && Date.now() < new Date(user.blockUntil).getTime()) {
            const remainingTime = Math.ceil((new Date(user.blockUntil).getTime() - Date.now()) / 1000);
            return next(new Error(`Too many attempts. Please try again after ${remainingTime} seconds.`, { cause: 429 }));
        }

    
        if (user.isConfirmed) {
            return next(new Error("Email is already confirmed", { cause: 400 }));
        }

    
        if (Date.now() > new Date(user.otpExpiresAt).getTime()) {
            return next(new Error("OTP has expired", { cause: 400 }));
        }

 
        const isValidOTP = comparehash({ planText: `${code}`, valuehash: user.emailOTP });
        if (!isValidOTP) {
          
            await dbservice.updateOne({ model: Usermodel, data: { $inc: { attemptCount: 1 } } })

  
            if (user.attemptCount + 1 >= 5) {
                const blockUntil = new Date(Date.now() + 2 * 60 * 1000); 
                await Usermodel.updateOne({ email }, { blockUntil, attemptCount: 0 });
                return next(new Error("Too many attempts. You are temporarily blocked for 2 minutes.", { cause: 429 }));
            }

            return next(new Error("Invalid OTP. Please try again.", { cause: 400 }));
        }

     
        await Usermodel.updateOne(
            { email },
            {

                isConfirmed: true,
                $unset: { emailOTP: 0, otpExpiresAt: 0, attemptCount: 0, blockUntil: 0 },
            }
        );
        const access_Token = generatetoken({
            payload: { id: user._id },
            signature: user.role === roletypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN,
        });

        const refreshToken = generatetoken({
            payload: { id: user._id },
            signature: user.role === roletypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN,
            expiresIn: "365d"
        });

        return successresponse(res, "Email confirmed successfully", 200, { access_Token, refreshToken });
    }
);




export const signupwithGmail = asyncHandelr(async (req, res, next) => {
    const { idToken } = req.body;
    const client = new OAuth2Client();

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.CIENT_ID,
        });
        return ticket.getPayload();
    }

    const payload = await verify();
    console.log("Google Payload Data:", payload);

    const { name, email, email_verified, picture } = payload;

    if (!email) {
        return next(new Error("Email is missing in Google response", { cause: 400 }));
    }
    if (!email_verified) {
        return next(new Error("Email not verified", { cause: 404 }));
    }

    let user = await dbservice.findOne({
        model: Usermodel,
        filter: { email },
    });

    if (user?.provider === providerTypes.system) {
        return next(new Error("Invalid account", { cause: 404 }));
    }

    if (!user) {
        user = await dbservice.create({
            model: Usermodel,
            data: {
                email,
                username: name,
                profilePic: { secure_url: picture },
                isConfirmed: email_verified,
                provider: providerTypes.google,
            },
        });
    }

    const access_Token = generatetoken({
        payload: { id: user._id },
        signature: user?.role === roletypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN,
    });

    const refreshToken = generatetoken({
        payload: { id: user._id },
        signature: user?.role === roletypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN,
        expiresIn: 31536000,
    });

    return successresponse(res, "Login successful", 200, { access_Token, refreshToken });
});


export const createImages = asyncHandelr(async (req, res, next) => {
    console.log(req.file); // مش req.files

    if (!req.file) {
        return next(new Error("❌ يجب رفع صورة واحدة!", { cause: 400 }));
    }

    const uploadedImage = await cloud.uploader.upload(req.file.path, { folder: `images` });

    const product = await ImageModel.create({
        image: {
            secure_url: uploadedImage.secure_url,
            public_id: uploadedImage.public_id
        }
    });

    return successresponse(res, "✅ تم رفع الصورة بنجاح بواسطة مستر عبده!", 201);
});


export const getAllImages = asyncHandelr(async (req, res, next) => {
    const images = await ImageModel.find();
    return successresponse(res, "✅ تم جلب الصور بنجاح", 200, images);
});

 
export const Getprofiledata = asyncHandelr(async (req, res, next) => {
    const user = await Usermodel.findById(req.user._id).populate("image");
    console.log("👤 User object:", user);
    console.log("🖼️ User image:", user.image);

    if (!user) {
        return next(new Error("User not found in system", { cause: 404 }));
    }

    // استخراج secure_url من الصورة
    let imageURL = null;
    if (user.image && user.image.image?.secure_url) {
        imageURL = user.image.image.secure_url;
    }

    return successresponse(res, {
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            image: imageURL
        }
    });
});
export const createClass = asyncHandelr(async (req, res, next) => {
    const { name } = req.body;

    if (!name) {
        return next(new Error("❌ الاسم مطلوب", { cause: 400 }));
    }

    const exist = await ClassModel.findOne({ name });
    if (exist) {
        return next(new Error("❌ الصف الدراسي موجود بالفعل", { cause: 409 }));
    }

    const newClass = await ClassModel.create({ name });

    res.status(201).json({
        message: "✅ تم إنشاء الصف الدراسي بنجاح",
      
    });
});
export const getAllClasses = asyncHandelr(async (req, res) => {
    const classes = await ClassModel.find().sort({ createdAt: -1 }); // أحدث صف في الأول

    res.status(200).json({
        message: "✅ تم جلب الصفوف الدراسية بنجاح",
        classes
    });
});
