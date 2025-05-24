import { asyncHandelr } from "../../../utlis/response/error.response.js";
import * as dbservice from "../../../DB/dbservice.js"
import Usermodel from "../../../DB/models/User.model.js";
import { successresponse } from "../../../utlis/response/success.response.js";
import { comparehash, decryptData, encryptData, generatehash } from "../../../utlis/security/hash.security.js";
import cloud from "../../../utlis/multer/cloudinary.js";
import { Folder } from "../../../DB/models/foldeer.model.js";
import File from "../../../DB/models/files.conrroller.js";
import fs from 'fs';



export const Updateuseraccount = asyncHandelr(async (req, res, next) => {
    const {
        lastName, mobileNumber, DOB, gender,
        firstName } = req.body
    

    const user = await dbservice.findOne({

        model: Usermodel,
        filter: {

            _id: req.user._id
        }
    })
    if (!user) {

        return next(new Error("user not found in system ", { cause: 404 }))
    }


    const encryptedPhone = encryptData(mobileNumber, process.env.CRYPTO_SECRET_KEY);
    

    await dbservice.findOneAndUpdate({
    
        model: Usermodel,
        filter: { _id: req.user._id },
        data: {

            lastName,
            DOB,
            firstName,
            gender,
            mobileNumber: encryptedPhone

        },
        options: {
            new:true
        }
          
          
       

})

    

    
    return successresponse(res, {

        username: req.user.username,
        gender: req.user.gender,
        mobileNumber: req.user.mobileNumber,
        DOB:req.user.DOB
     
        
     })
})

export const updatepassword = asyncHandelr(async (req, res, next) => {
    const { oldpassword, password, confirmationpassword } = req.body
    if (!comparehash({ planText: oldpassword, valuehash: req.user.password })) {
        
        return next(new Error("password not correct", { cause: 404 }))
    }
  
    
    const user = await dbservice.findOneAndUpdate({

        model: Usermodel,
        filter: {

            _id: req.user._id
        },
        data: {
            password: generatehash({ planText: password }) 
            , changecredintialTime: Date.now()
        }
    })



 


    return successresponse(res,"done success", 201, {
     username:user.username
    })
})



export const Getloginuseraccount = asyncHandelr(async (req, res, next) => {
    const user = await dbservice.findOne({
        model: Usermodel,
        filter: { _id: req.user._id }
    });

    if (!user) {
        return next(new Error("User not found in system", { cause: 404 }));
    }

    return successresponse(res, "User fetched successfully", 200, {
        username: user.username,
        email: user.email,
        isBrimume: user.isBrimume,
        userId: user.userId,
        profilePic: user.profilePic?.secure_url || null, // يرجع رابط الصورة أو null لو مش موجودة
    });
});



export const Getprofiledata = asyncHandelr(async (req, res, next) => {

    const user = await dbservice.findOne({

        model: Usermodel,
        filter: {

            _id: req.user._id
        }
    })
    if (!user) {

        return next(new Error("user not found in system ", { cause: 404 }))
    }

    const decryptphone = decryptData(user.mobileNumber, process.env.CRYPTO_SECRET_KEY)
    return successresponse(res, {
        username: user.username,
        coverPic: user.coverPic,
        profilePic: user.profilePic,
    
        mobileNumber: decryptphone,
    })
})


export const updateUsername = asyncHandelr(async (req, res, next) => {
    const { username } = req.body;

    if (!username || username.trim() === "") {
        return next(new Error("Username is required", { cause: 400 }));
    }

    const user = await dbservice.findOneAndUpdate({
        model: Usermodel,
        filter: { _id: req.user._id },
        data: { username },
        options: { new: true } // يرجع البيانات بعد التعديل
    });

    if (!user) {
        return next(new Error("User not found", { cause: 404 }));
    }

    return successresponse(res, "Username updated successfully", 200, {
        username: user.username
    });
});



export const subscribeToPremium = asyncHandelr(async (req, res, next) => {
    const userId = req.user._id;

    const user = await dbservice.findOneAndUpdate({
        model: Usermodel,
        filter: { _id: userId },
        data: { isBrimume: true },
        options: { new: true }, // يرجع النسخة بعد التحديث
    });

    if (!user) {
        return next(new Error("❌ المستخدم غير موجود", { cause: 404 }));
    }

    return successresponse(res, "✅ تم تفعيل الاشتراك البريميوم بنجاح", 200, {
        username: user.username,
        email: user.email,
        isBrimume: user.isBrimume,
    });
});
  










export const updateimage = asyncHandelr(async (req, res, next) => {
    // ارفع الصورة الجديدة على Cloudinary
    const { secure_url, public_id } = await cloud.uploader.upload(req.file.path, {
        folder: `user/${req.user._id}`
    });

    // جلب بيانات المستخدم الحالية
    const user = await dbservice.findOne({
        model: Usermodel,
        filter: { _id: req.user._id },
    });

    // حذف الصورة القديمة إن وجدت
    if (user?.profilePic?.public_id) {
        try {
            await cloud.uploader.destroy(user.profilePic.public_id);
        } catch (err) {
            console.error("خطأ في حذف الصورة القديمة:", err.message);
        }
    }

    // تحديث المستخدم بالصورة الجديدة
    const updatedUser = await dbservice.findOneAndUpdate({
        model: Usermodel,
        filter: { _id: req.user._id },
        data: { profilePic: { secure_url, public_id } },
        options: { new: true },
    });

    return successresponse(res, "تم تحديث صورة المستخدم بنجاح", 200, {
        // file: req.file,
        // user: updatedUser,
    });
});


export const coverimages = asyncHandelr(async (req, res, next) => {

    const images = [];
    for (const file of req.files) {
        const { secure_url, public_id } = await cloud.uploader.upload(file.path, { folder: `user/${req.user._id}/cover` })
        images.push({ public_id, secure_url })
    }

    const user = await dbservice.findOneAndUpdate({

        model: Usermodel,
        filter: {
            _id: req.user._id,

        },
        data: {

            coverPic: images
        },
        options: {
            new: true,
        }
    })



    return successresponse(res, "user updated sucsess", 200, {
        file: req.files,
        user

    });
});






export const deleteProfileImage = asyncHandelr(async (req, res, next) => {
    // البحث عن المستخدم للحصول على الصورة الحالية
    const user = await dbservice.findOne({
        model: Usermodel,
        filter: { _id: req.user._id },
    });

    // التحقق مما إذا كان لدى المستخدم صورة بالفعل
    if (!user?.profilePic?.public_id) {
        return next(new Error("No profile image found to delete", { cause: 404 }));
    }

    // حذف الصورة من Cloudinary
    await cloud.uploader.destroy(user.profilePic.public_id);

    // إزالة بيانات الصورة من المستخدم
    await dbservice.findOneAndUpdate({
        model: Usermodel,
        filter: { _id: req.user._id },
        data: { profilePic: null }, // تعيين الصورة إلى null لحذفها
        options: { new: true },
    });

    return successresponse(res, "Profile image deleted successfully", 200, {
        message: "Profile image removed",
    });
});


export const deleteCoverImage = asyncHandelr(async (req, res, next) => {
    const { public_id } = req.body; 
    const userId = req.user._id; 


    await cloud.uploader.destroy(public_id);

   
    const updatedUser = await dbservice.findOneAndUpdate({
        model: Usermodel,
        filter: { _id: userId },
        data: { $pull: { coverPic: { public_id } } }, 
        options: { new: true }
    });

    return successresponse(res, "Cover image deleted successfully", 200, {
        user: updatedUser
    });
});




export const createFolder = asyncHandelr(async (req, res, next) => {
    const { name } = req.body;
    const userId = req.user._id;

    if (!name) {
        return res.status(400).json({ message: "❌ اسم المجلد مطلوب" });
    }

    const folder = await Folder.create({ name, userId });

    return res.status(201).json({
        message: "✅ تم إنشاء المجلد",
   
    });
});
  
export const getUserFolders = asyncHandelr(async (req, res) => {
    const userId = req.user._id;

    const folders = await Folder.find({ userId });

    res.status(200).json({
        message: "✅ تم جلب المجلدات الخاصة بك",
        folders,
    });
});
  
export const createFile = async (req, res) => {
    try {
        const userId = req.user._id;
        const file = req.file;
        const { shared = false } = req.body;
        const { folderId } = req.params;

        if (!file) {
            return res.status(400).json({ message: "❌ يرجى رفع ملف." });
        }

        let resourceType = "raw";
        if (file.mimetype.startsWith("image/")) resourceType = "image";
        else if (file.mimetype.startsWith("video/")) resourceType = "video";

        const result = await cloud.uploader.upload(file.path, {
            resource_type: resourceType,
            folder: folderId ? `cloudbox/${folderId}` : "cloudbox",
            use_filename: true,
            unique_filename: false,
        });

        const fileSizeMB = Math.ceil(file.size / (1024 * 1024));

        let sharedUrl = null;
        if (shared === true || shared === "true") {
            const uniqueId = nanoid(10);
            sharedUrl = `https://yourapp.com/shared/${uniqueId}`;
        }

        const savedFile = await File.create({
            userId,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: fileSizeMB,
            url: result.secure_url,
            shared,
            sharedUrl,
            folderId: folderId || null,
        });

        fs.unlinkSync(file.path);

        res.status(201).json({
            message: "✅ تم رفع الملف بنجاح",
            file: savedFile,
            ...(sharedUrl && { sharedUrl }),
        });
    } catch (err) {
        res.status(500).json({
            message: "❌ حدث خطأ أثناء رفع الملف",
            error: err.message,
        });
    }
};
  
export const getFolderFiles = asyncHandelr(async (req, res) => {
    const userId = req.user._id;
    const { folderId } = req.params;
    const { type } = req.query;

    const filter = { userId, folderId };

    if (type) {
        const typeMap = {
            image: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
            video: ['video/mp4', 'video/mpeg', 'video/x-msvideo'],
            document: ['application/pdf', 'application/json'],
            zip: ['application/zip', 'application/x-zip-compressed'],
        };

        const mimeTypes = typeMap[type.toLowerCase()];
        if (mimeTypes) {
            filter.fileType = { $in: mimeTypes };
        }
    }

    const files = await File.find(filter);

    res.status(200).json({
        message: "✅ تم جلب الملفات داخل المجلد",
        files,
    });
});
  
const getPublicIdFromUrl = (url) => {
    const parts = url.split("/");
    const filenameWithExtension = parts.pop().split(".")[0]; // آخر جزء قبل الامتداد
    const folder = parts.slice(parts.indexOf("cloudbox")).join("/"); // لو فيه فولدر
    return `${folder}/${filenameWithExtension}`;
};

export const deleteFolder = asyncHandelr(async (req, res) => {
    const userId = req.user._id;
    const { folderId } = req.params;

    // التحقق من أن المجلد موجود ويخص المستخدم
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
        return res.status(404).json({ message: "❌ المجلد غير موجود أو لا يخصك" });
    }

    // جلب الملفات داخل المجلد
    const files = await File.find({ folderId, userId });

    // حذف كل ملف من Cloudinary
    for (const file of files) {
        let resourceType = "raw";
        if (file.fileType.startsWith("image/")) {
            resourceType = "image";
        } else if (file.fileType.startsWith("video/")) {
            resourceType = "video";
        }

        const publicId = getPublicIdFromUrl(file.url);
        await cloud.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    }

    // حذف الملفات من قاعدة البيانات
    await File.deleteMany({ folderId, userId });

    // حذف المجلد نفسه
    await Folder.findByIdAndDelete(folderId);

    res.status(200).json({
        message: "✅ تم حذف المجلد وكل ما بداخله",
    });
});
