import { asyncHandelr } from "../../../utlis/response/error.response.js";
import * as dbservice from "../../../DB/dbservice.js"
import Usermodel from "../../../DB/models/User.model.js";
import { successresponse } from "../../../utlis/response/success.response.js";
import { comparehash, decryptData, encryptData, generatehash } from "../../../utlis/security/hash.security.js";
import cloud from "../../../utlis/multer/cloudinary.js";
import { Folder } from "../../../DB/models/foldeer.model.js";
import File from "../../../DB/models/files.conrroller.js";
import fs from 'fs';
import admin from 'firebase-admin';

import axios from 'axios';

import { NotificationModel } from "../../../DB/models/points.model.js";

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
        country: user.country,
        _id: user._id,
        email: user.email,
        isBrimume: user.isBrimume,
        userId: user.userId,
        isPromoter: user.isPromoter,
        role: user.role,
        watchingplan: user.watchingplan,
        Downloadsplan: user.Downloadsplan,
        referralLink: user.referralLink,
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
  

export const generateFolderShareLink = async (req, res) => {
    try {
        const userId = req.user._id;
        const { folderId } = req.body;

        if (!folderId) {
            return res.status(400).json({ message: '❌ يُرجى إرسال معرف المجلد.' });
        }

        const folder = await Folder.findOne({ _id: folderId, userId });

        if (!folder) {
            return res.status(404).json({ message: '❌ المجلد غير موجود أو لا تملك صلاحية الوصول إليه.' });
        }

        const branchRes = await axios.post('https://api2.branch.io/v1/url', {
            branch_key: process.env.BRANCH_KEY,
            campaign: 'folder_share',
            feature: 'sharing',
            channel: 'in_app',
            data: {
                "$deeplink_path": `shared-folder/${folderId}`,
                "folder_id": folderId,
                "shared_by": userId,
                "$android_url": `https://mega-box.vercel.app/shared-folder/${folderId}`,
                "$fallback_url": `https://mega-box.vercel.app/shared-folder/${folderId}`,
                "$desktop_url": `https://mega-box.vercel.app/shared-folder/${folderId}`,
                "$og_title": "📂 مشاركة مجلد",
                "$og_description": `تمت مشاركة مجلد "${folder.name}" معك`,
                "$og_image_url": "https://mega-box.vercel.app/share/78///folder-share-image.png"
            }
        });

        const shareLink = branchRes.data?.url;

        if (!shareLink) {
            return res.status(500).json({ message: '❌ لم يتم استلام رابط المشاركة من Branch.' });
        }

        folder.shared = true;
        folder.sharedUrl = shareLink;
        folder.sharedBy = userId;
        await folder.save();

        return res.status(200).json({
            message: "✅ تم إنشاء رابط مشاركة المجلد بنجاح",
            shareUrl: shareLink,
        });

    } catch (err) {
        console.error("Error generating folder share link:", err);
        return res.status(500).json({
            message: "❌ حدث خطأ أثناء إنشاء رابط المشاركة",
            error: err?.response?.data || err.message,
        });
    }
};
export const getSharedFoldersWithFiles = async (req, res) => {
    try {
        const userId = req.user._id;

        const folders = await Folder.find({ userId, shared: true });

        const result = [];

        for (const folder of folders) {
            const files = await File.find({ folderId: folder._id });

            result.push({
                folder: {
                    id: folder._id,
                    name: folder.name,
                    shared: folder.shared,
                    sharedUrl: folder.sharedUrl,
                },
                files: files.map(file => ({
                    id: file._id,
                    fileName: file.fileName,
                    fileType: file.fileType,
                    fileSize: file.fileSize,
                    url: file.url,
                    shared: file.shared,
                    sharedUrl: file.sharedUrl
                }))
            });
        }

        return res.status(200).json({
            message: "✅ تم جلب المجلدات المشتركة مع الملفات بنجاح",
            folders: result
        });

    } catch (err) {
        console.error("Error fetching shared folders and files:", err);
        return res.status(500).json({
            message: "❌ حدث خطأ أثناء جلب المجلدات المشتركة",
            error: err.message
        });
    }
};


export const disableFileShare = async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({ message: "❌ الملف غير موجود." });
        }

        // 🔄 إذا الملف غير مشارك → ارجعه مشارك تاني بنفس الرابط السابق
        if (!file.shared && file.sharedUrl) {
            file.shared = true;
            await file.save();
            return res.status(200).json({
                message: "✅ تم إعادة تفعيل مشاركة الملف.",
                shareUrl: file.sharedUrl,
            });
        }

        // 🔒 لو الملف مشارك → قم بتعطيل المشاركة
        file.shared = false;
        await file.save();

        return res.status(200).json({ message: "✅ تم تعطيل مشاركة الملف." });

    } catch (err) {
        console.error("Error disabling share:", err);
        return res.status(500).json({ message: "❌ حدث خطأ أثناء تعطيل المشاركة", error: err.message });
    }
};
  

export const getSharedFolderContent = async (req, res) => {
    try {
        const { folderId } = req.params;

        if (!folderId) {
            return res.status(400).json({ message: "❌ يجب إرسال معرف المجلد." });
        }

        const folder = await Folder.findById(folderId).populate("userId", "username email");

        if (!folder || !folder.shared) {
            return res.status(404).json({ message: "❌ المجلد غير موجود أو لم يتم مشاركته." });
        }

        const files = await File.find({ folderId });

        return res.status(200).json({
            message: "✅ تم جلب محتوى المجلد بنجاح",
            folder: {
                id: folder._id,
                name: folder.name,
                sharedBy: {
                    username: folder.userId.username,
                    email: folder.userId.email,
                },
                createdAt: folder.createdAt,
                files: files.map(file => ({
                    id: file._id,
                    name: file.fileName,
                    type: file.fileType,
                    size: file.fileSize,
                    url: file.url,
                    createdAt: file.createdAt,
                }))
            }
        });

    } catch (err) {
        console.error("Error in getSharedFolderContent:", err);
        return res.status(500).json({ message: "❌ حدث خطأ أثناء جلب المجلد", error: err.message });
    }
};


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





admin.initializeApp({
    credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL ?? "")}`,
    }),
});

async function sendNotification(deviceToken, title, body) {
    const message = {
        notification: { title, body },
        token: deviceToken,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('✅ تم إرسال الإشعار:', response);
    } catch (error) {
        console.error('❌ فشل إرسال الإشعار:', error);
    }
}

// sendNotification('eXz4VgAGQlOXVYLXT5As5M:APA91bFSqGnJa7BmqsfaSEEvjUvi6Y2IRpLGQ12-TZ0sQSL07eKmPVKdHvikiLOPpDjvv8bzD_2rN7V3eEveqE3ef6xJkbQuczadHMY2lvjnPSWMMbwIN_A', 'عنوان الإشعار', 'نص الإشعار هنا');

export const savetoken = asyncHandelr(async (req, res, next) => {
    const { userId, fcmToken } = req.body;

    if (!userId || !fcmToken) {
        return res.status(400).json({ message: "userId و fcmToken مطلوبين" });
    }

    try {
        await Usermodel.findByIdAndUpdate(userId, { fcmToken });
        res.json({ message: "تم حفظ التوكن بنجاح" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "حدث خطأ أثناء حفظ التوكن" });
    }

});


export const deleteFcmToken = asyncHandelr(async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await Usermodel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "❌ المستخدم غير موجود!" });
        }

        user.fcmToken = null; // 🧹 حذف التوكن
        await user.save();

        res.status(200).json({ message: "✅ تم حذف FCM Token بنجاح" });
    } catch (error) {
        console.error("❌ خطأ أثناء حذف التوكن:", error);
        res.status(500).json({ message: "حدث خطأ أثناء حذف التوكن", error: error.message });
    }
});


export const getAllUsers = asyncHandelr(async (req, res, next) => {
    // ✅ جلب المستخدمين مع تصفية الـ role
    const users = await Usermodel.find({ role: "User" })
        .select("email username userId isBrimume ")
        .lean(); // تحويل النتيجة إلى كائن عادي

    const totalUsers = users.length;

    const formattedUsers = users.map(user => ({
        username: user.username,
        userId: user.userId,
        email: user.email,
        id: user._id,
        isBrimume: user.isBrimume,
      
    }));

    return successresponse(res, {
        message: "Users retrieved successfully",
        totalUsers,
        users: formattedUsers
    });
});


export const sendnotification = asyncHandelr(async (req, res, next) => {
    const { _id, title, body } = req.body;

    if (!_id || !title || !body) {
        return res.status(400).json({ message: "userId و title و body مطلوبين" });
    }

    try {
        const user = await Usermodel.findById(_id);
        if (!user || !user.fcmToken) {
            return res.status(404).json({ message: "المستخدم غير موجود أو لا يحتوي على FCM Token" });
        }

        const message = {
            notification: { title, body },
            token: user.fcmToken,
        };

        await NotificationModel.create({ user: user._id, title, body });

        const response = await admin.messaging().send(message);
        console.log('✅ تم إرسال الإشعار:', response);

        res.json({ message: "تم إرسال الإشعار بنجاح", response });
    } catch (error) {
        console.error('❌ فشل إرسال الإشعار:', error);
        res.status(500).json({ message: "فشل إرسال الإشعار", error: error.message });
    }

});


export const notifyall = asyncHandelr(async (req, res, next) => {
    const { title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ message: "العنوان والمحتوى مطلوبين" });
    }

    try {
        const users = await Usermodel.find({ fcmToken: { $ne: null } });

        let successCount = 0;
        let failCount = 0;

        for (let user of users) {
            try {
                // 1. إرسال الإشعار
                await sendNotification(user.fcmToken, title, body);

                // 2. تخزين الإشعار في قاعدة البيانات
                await NotificationModel.create({
                    user: user._id,
                    title,
                    body,
                    isRead: false
                });

                successCount++;
            } catch (e) {
                console.error(`❌ فشل إرسال/تخزين إشعار للمستخدم ${user._id}:`, e.message);
                failCount++;
            }
        }

        return res.status(200).json({
            message: "✅ تم تنفيذ إرسال وتخزين الإشعارات",
            totalUsers: users.length,
            successCount,
            failCount
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "❌ حدث خطأ أثناء إرسال الإشعارات" });
    }
});

export const getUserNotifications = asyncHandelr(async (req, res) => {
    const userId = req.user._id; // تأكد إنك ممرر `auth middleware`

    const notifications = await NotificationModel.find({ user: userId })
        .sort({ createdAt: -1 }); // الأحدث أولًا

    res.status(200).json({
        message: "📬 تم جلب الإشعارات",
        notifications
    });
});


export const markAllAsRead = asyncHandelr(async (req, res) => {
    const userId = req.user._id;

    await NotificationModel.updateMany(
        { user: userId, isRead: false },
        { $set: { isRead: true } }
    );

    res.status(200).json({ message: "✅ تم تعليم كل الإشعارات كمقروءة" });
});
