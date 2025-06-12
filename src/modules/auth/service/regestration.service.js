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
import { QuestionModel } from "../../../DB/models/question.model.js";
import { SubjectModel } from "../../../DB/models/supject.model.js";
import { RankModel } from "../../../DB/models/rank.model.js";
// import { PointModel } from "../../../DB/models/points.model.js";
import { AnswerModel } from "../../../DB/models/anser.model.js";
import { nanoid } from 'nanoid';
import bcrypt from "bcrypt"
import File from "../../../DB/models/files.conrroller.js";
// import admin from 'firebase-admin';
import fs from 'fs';
import axios from 'axios';
import { FileShareAnalytics } from "../../../DB/models/analises.model.js";
import { ViewLog } from "../../../DB/models/views.model.js";
import mongoose from "mongoose";
import geoip from 'geoip-lite';
import { getName } from 'country-list';
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

//   ى   return successresponse(res, "User created successfully", 201, { user });


// })

// utils/countryPricing.js
export const countryPricing = {
    EG: 0.0003,        // Egypt
    IN: 0.0002,        // India
    SA: 0.0015,        // Saudi Arabia
    AE: 0.0012,        // UAE
    KW: 0.0014,        // Kuwait
    US: 0.0018,        // USA
    DEFAULT: 0.0001    // Any other country
};
  
export const getUserEarnings = async (req, res) => {
    try {
        const userId = req.user._id;

        // الملفات المشتركة الخاصة بالمستخدم
        const files = await File.find({ userId, shared: true }).select('_id fileName');

        const fileIds = files.map(f => f._id);

        const analytics = await FileShareAnalytics.find({ fileId: { $in: fileIds } })
            .select('fileId earnings');

        const totalEarnings = analytics.reduce((sum, record) => sum + (record.earnings || 0), 0);

        return res.status(200).json({
            message: "✅ تم جلب أرباح المستخدم بنجاح",
            totalEarnings: totalEarnings.toFixed(6), // بالدقة
            currency: "USD"
        });
    } catch (err) {
        console.error("Error in getUserEarnings:", err);
        return res.status(500).json({ message: "❌ حدث خطأ أثناء جلب الأرباح", error: err.message });
    }
};
  



export const createFile = async (req, res) => {
    try {
        const userId = req.user._id;
        const file = req.file;
        const { shared = false } = req.body;

        if (!file) {
            return res.status(400).json({ message: "❌ يرجى رفع ملف." });
        }

        // تحديد نوع المورد المناسب
        let resourceType = "raw"; // الافتراضي
        if (file.mimetype.startsWith("image/")) resourceType = "image";
        else if (file.mimetype.startsWith("video/")) resourceType = "video";

        // رفع الملف إلى Cloudinary
        const result = await cloud.uploader.upload(file.path, {
            resource_type: resourceType,
            folder: "cloudbox",
            type: "upload", // مهم جدًا ليكون الملف عامًا
            use_filename: true,
            unique_filename: false, // عشان يحتفظ بالاسم الأصلي
        });

        const fileSizeMB = Math.ceil(file.size / (1024 * 1024));

        // إنشاء رابط مشاركة إذا الملف مشترك
        let sharedUrl = null;
        if (shared === true || shared === "true") {
            const uniqueId = nanoid(10);
            sharedUrl = `https://yourapp.com/shared/${uniqueId}`;
        }

        // حفظ في قاعدة البيانات
        const savedFile = await File.create({
            userId,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: fileSizeMB,
            url: result.secure_url,
            shared,
            sharedUrl,
        });

        // حذف الملف المؤقت من السيرفر
        fs.unlinkSync(file.path);

        res.status(201).json({
            message: "✅ تم رفع الملف بنجاح",
            file: savedFile,
            ...(sharedUrl && { sharedUrl }),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "❌ حدث خطأ أثناء رفع الملف",
            error: err.message,
        });
    }
  };

export const deleteFile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fileId } = req.params;

        // التحقق من وجود الملف
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: "❌ الملف غير موجود" });
        }

        // التأكد أن الملف يخص المستخدم
        if (file.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "❌ غير مصرح لك بحذف هذا الملف" });
        }

        // استخراج public_id من رابط Cloudinary
        const publicId = file.url.split("/").slice(-1)[0].split(".")[0];
        const resourceType = file.fileType.startsWith("image/")
            ? "image"
            : file.fileType.startsWith("video/")
                ? "video"
                : "raw";

        // حذف من Cloudinary
        await cloud.uploader.destroy(`cloudbox/${publicId}`, {
            resource_type: resourceType,
        });

        // حذف من قاعدة البيانات
        await file.deleteOne();

        res.status(200).json({ message: "✅ تم حذف الملف بنجاح" });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "❌ حدث خطأ أثناء حذف الملف",
            error: err.message,
        });
    }
  };

export const updateFileName = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fileId } = req.params;
        const { newFileName } = req.body;

        if (!newFileName) {
            return res.status(400).json({ message: "❌ يرجى إدخال اسم جديد للملف." });
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: "❌ الملف غير موجود." });
        }

        if (file.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "❌ غير مصرح لك بتعديل هذا الملف." });
        }

        // استخراج الامتداد القديم
        const oldExtension = file.fileName.split(".").pop();
        const newFileNameWithExtension = newFileName.endsWith(`.${oldExtension}`)
            ? newFileName
            : `${newFileName}.${oldExtension}`;

        file.fileName = newFileNameWithExtension;
        await file.save();

        res.status(200).json({
            message: "✅ تم تعديل اسم الملف بنجاح",
            file,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "❌ حدث خطأ أثناء تعديل اسم الملف",
            error: err.message,
        });
    }
};
  



export const getUserFiles = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type } = req.query; // مثال: ?type=image أو ?type=video

        // التحقق إذا فيه نوع محدد
        let filter = { userId };
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
        const totalUsed = files.reduce((sum, file) => sum + file.fileSize, 0);

        res.status(200).json({
            files,
            totalUsedMB: totalUsed,
        });
    } catch (err) {
        res.status(500).json({ message: '❌ خطأ في جلب الملفات', error: err.message });
    }
};




export const generateShareLink = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fileId } = req.body;


        if (!fileId) {
            return res.status(400).json({ message: '❌ يُرجى إرسال معرف الملف.' });
        }

        // التحقق من ملكية الملف
        const file = await File.findOne({ _id: fileId, userId });

        if (!file) {
            return res.status(404).json({
                message: '❌ الملف غير موجود أو لا تملك صلاحية الوصول إليه.',
            });
        }

        // طلب إنشاء الرابط من Branch
        const branchRes = await axios.post('https://api2.branch.io/v1/url', {
            branch_key: process.env.BRANCH_KEY,
            campaign: 'file_share',
            feature: 'sharing',
            channel: 'in_app',
            data: {
                "$deeplink_path": `shared/${fileId}`,
                "file_id": fileId,
                "shared_by": userId,
                "$android_url": "https://mega-box.vercel.app/share/78",
                "$fallback_url": "https://mega-box.vercel.app/share/78",
                "$desktop_url": "https://mega-box.vercel.app/share/78",
                "$og_title": "📁 مشاركة ملف",
                "$og_description": "تمت مشاركة هذا الملف معك",
                "$og_image_url": "https://mega-box.vercel.app/share/78///share-image.png"
            }
        });




        
        const shareLink = branchRes.data?.url;

        if (!shareLink) {
            return res.status(500).json({ message: '❌ لم يتم استلام رابط المشاركة من Branch.' });
        }

        // تحديث الملف
        file.shared = true;
        file.sharedUrl = shareLink;
        await file.save();

        return res.status(200).json({
            message: "✅ تم إنشاء رابط المشاركة بنجاح",
            shareUrl: shareLink,
        });

    } catch (err) {
        console.error("Error generating share link:", err);
        return res.status(500).json({
            message: "❌ حدث خطأ أثناء إنشاء رابط المشاركة",
            error: err?.response?.data || err.message,
        });
    }
};




export const getSharedFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({ message: "❌ يجب إرسال معرف الملف." });
        }

        const file = await File.findById(fileId).populate("userId", "username email");

        if (!file || !file.shared) {
            return res.status(404).json({ message: "❌ الملف غير موجود أو لم يتم مشاركته." });
        }

        // IP
        const ip =
            req.headers['x-forwarded-for'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            '0.0.0.0';

        const geo = geoip.lookup(ip);
        const countryCode = geo?.country || 'Unknown';
        const country = countryCode; // استخدم كود الدولة فقط (مثل "US", "EG", إلخ)

        const pricePerView = countryPricing[countryCode] || countryPricing.DEFAULT;

        const existingDoc = await FileShareAnalytics.findOne({ fileId });

        if (!existingDoc) {
            await FileShareAnalytics.create({
                fileId,
                downloads: 0,
                views: 1,
                earnings: pricePerView,
                lastUpdated: new Date(),
                viewers: [{ country, views: 1, earnings: pricePerView }]
            });
        } else {
            const viewerIndex = existingDoc.viewers.findIndex(v => v.country === country);

            if (viewerIndex !== -1) {
                await FileShareAnalytics.updateOne(
                    { fileId, [`viewers.${viewerIndex}.country`]: country },
                    {
                        $inc: {
                            views: 1,
                            earnings: pricePerView,
                            [`viewers.${viewerIndex}.views`]: 1,
                            [`viewers.${viewerIndex}.earnings`]: pricePerView
                        },
                        $set: { lastUpdated: new Date() }
                    }
                );
            } else {
                await FileShareAnalytics.updateOne(
                    { fileId },
                    {
                        $inc: { views: 1, earnings: pricePerView },
                        $set: { lastUpdated: new Date() },
                        $push: { viewers: { country, views: 1, earnings: pricePerView } }
                    }
                );
            }
        }

        return res.status(200).json({
            message: "✅ تم جلب الملف بنجاح",
            file: {
                id: file._id,
                name: file.fileName,
                type: file.fileType,
                size: file.fileSize,
                url: file.url,
                sharedBy: {
                    username: file.userId.username,
                    email: file.userId.email,
                },
                createdAt: file.createdAt,
            }
        });

    } catch (err) {
        console.error("Error in getSharedFile:", err);
        return res.status(500).json({ message: "❌ حدث خطأ أثناء جلب الملف", error: err.message });
    }
};


export const incrementFileView = async (req, res, next) => {
    try {
        const { fileId } = req.params; // استخدام req.params بدلاً من req.body

        if (!fileId) {
            return res.status(400).json({ message: '❌ يجب إرسال معرف الملف.' });
        }

        await FileShareAnalytics.findOneAndUpdate(
            { fileId },
            {
                $inc: { views: 1 },
                $set: { lastUpdated: new Date() }
            },
            { upsert: true, new: true }
        );

        next();
    } catch (err) {
        console.error('Error in incrementFileView:', err);
        return res.status(500).json({
            message: '❌ حدث خطأ أثناء تسجيل المشاهدة',
            error: err.message,
        });
    }
};



export const getShareLinkAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;

        const files = await File.find({ userId, shared: true }).select('_id fileName sharedUrl');

        if (!files || files.length === 0) {
            return res.status(404).json({
                message: '❌ لا توجد ملفات مشتركة لهذا المستخدم.',
                analytics: [],
            });
        }

        const fileIds = files.map(file => file._id);

        const analytics = await FileShareAnalytics.find({ fileId: { $in: fileIds } })
            .select('fileId downloads views lastUpdated viewers');

        const userAnalytics = files.map(file => {
            const analytic = analytics.find(a => a.fileId.toString() === file._id.toString());

            let viewsByCountry = [];

            if (analytic?.viewers?.length > 0) {
                viewsByCountry = analytic.viewers.map(viewer => ({
                    country: viewer.country || 'Unknown',
                    views: viewer.views || 1,
                }));
            }

            return {
                fileId: file._id,
                fileName: file.fileName,
                sharedUrl: file.sharedUrl,
                downloads: analytic ? analytic.downloads : 0,
                views: analytic ? analytic.views : 0,
                lastUpdated: analytic ? analytic.lastUpdated : null,
                viewsByCountry
            };
        });

        return res.status(200).json({
            message: '✅ تم جلب بيانات التحليلات بنجاح',
            analytics: userAnalytics,
        });
    } catch (err) {
        console.error('Error in getShareLinkAnalytics:', err);
        return res.status(500).json({
            message: '❌ حدث خطأ أثناء جلب بيانات التحليلات',
            error: err.message,
        });
    }
};
  


export const getUserAnalytics = async (req, res) => {
    try {
        const userId = req.user._id; // جلب معرف المستخدم من التوثيق

        // جلب كل الملفات المشتركة الخاصة بالمستخدم
        const files = await File.find({ userId, shared: true }).select('_id');

        if (!files || files.length === 0) {
            return res.status(404).json({
                message: '❌ لا توجد ملفات مشتركة لهذا المستخدم.',
                totalAnalytics: {
                    totalDownloads: 0,
                    totalViews: 0
                }
            });
        }

        // استخراج معرفات الملفات
        const fileIds = files.map(file => file._id);

        // جلب بيانات التحليلات وتجميع المشاهدات والتحميلات
        const analytics = await FileShareAnalytics.aggregate([
            { $match: { fileId: { $in: fileIds } } },
            {
                $group: {
                    _id: null,
                    totalDownloads: { $sum: '$downloads' },
                    totalViews: { $sum: '$views' }
                }
            }
        ]);

        // تحضير الرد
        const totalAnalytics = analytics.length > 0 ? {
            totalDownloads: analytics[0].totalDownloads || 0,
            totalViews: analytics[0].totalViews || 0
        } : {
            totalDownloads: 0,
            totalViews: 0
        };

        return res.status(200).json({
            message: '✅ تم جلب إجمالي بيانات التحليلات بنجاح',
            totalAnalytics
        });
    } catch (err) {
        console.error('Error in getUserTotalAnalytics:', err);
        return res.status(500).json({
            message: '❌ حدث خطأ أثناء جلب إجمالي بيانات التحليلات',
            error: err.message
        });
    }
};








// axios.post('https://api2.branch.io/v1/url', {
//     branch_key: 'key_test_asCmg1x2BDyHh3GHNcEzofihqvepEG95',
//     data: {
//         "$deeplink_path": "shared/683c27333577316ffd99166d",
//         "$fallback_url": "https://www.google.com"
//     }
// }).then(res => {
//     console.log(res.data.url);
// });
  

export const shareFile = async (req, res) => {
    try {
        const fileId = req.params.id;

        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ message: '❌ الملف غير موجود' });

        // لو فيه رابط مشاركة بالفعل
        if (file.shared && file.sharedUrl) {
            return res.status(200).json({
                message: '✅ رابط المشاركة موجود بالفعل',
                sharedUrl: file.sharedUrl,
            });
        }

        const uniqueId = nanoid(10);
        const sharedUrl = `https://yourapp.com/shared/${uniqueId}`; // عدل الرابط حسب نطاقك

        file.shared = true;
        file.sharedUrl = sharedUrl;

        await file.save();

        res.status(200).json({
            message: '✅ تم إنشاء رابط المشاركة',
            sharedUrl,
        });
    } catch (err) {
        res.status(500).json({ message: '❌ حدث خطأ أثناء المشاركة', error: err.message });
    }
  };


// export const getSharedFile = async (req, res) => {
//     try {
//         const { uniqueId } = req.params;
//         const fullUrl = `https://yourapp.com/shared/${uniqueId}`;

//         const file = await File.findOne({ shared: true, sharedUrl: fullUrl });

//         if (!file) {
//             return res.status(404).json({ message: '❌ الملف غير موجود أو لم تتم مشاركته' });
//         }

//         res.status(200).json({
//             fileName: file.fileName,
//             fileType: file.fileType,
//             url: file.url,
//             createdAt: file.createdAt,
//         });
//     } catch (err) {
//         res.status(500).json({ message: '❌ خطأ في الوصول للملف المشترك', error: err.message });
//     }
// };
  
export const getUserStorageUsage = async (req, res) => {
    try {
        const userId = req.user._id;

        // نجمع الحجم الكلي لجميع الملفات المرفوعة من هذا المستخدم
        const files = await File.find({ userId });

        const totalUsedMB = files.reduce((sum, file) => sum + (file.fileSize || 0), 0);

        res.status(200).json({
            message: "✅ تم حساب المساحة المستخدمة",
            totalFiles: files.length,
            totalUsedMB,
            totalUsedGB: (totalUsedMB / 1024).toFixed(3),

        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "❌ خطأ أثناء حساب المساحة", error: err.message });
    }
};



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

export const updateProfile = asyncHandelr(async (req, res, next) => {
    const { watchingplan, Downloadsplan, isPromoter } = req.body;

   
    const _id = req.user._id;

    // التأكد أن المستخدم موجود
    const user = await dbservice.findOne({ model: Usermodel, filter: { _id } });
    if (!user) {
        return next(new Error("User not found", { cause: 404 }));
    }

    // تحديث البيانات المطلوبة فقط
    const updatedUser = await dbservice.updateOne({
        model: Usermodel,
        filter: { _id },
        data: {
            ...(isPromoter && { isPromoter }),
            ...(Downloadsplan && { Downloadsplan }),
            ...(watchingplan && { watchingplan }),
         
        },
        options: { new: true }, // لإرجاع البيانات بعد التعديل
    });

    return successresponse(res, "User profile updated successfully", 200);
});






export const getUserRoleById = asyncHandelr(async (req, res, next) => {
    const { _id } = req.params;

    // تأكد إن _id صالح
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await Usermodel.findById(_id).select("role");

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
        message: "User role fetched successfully",
        data: {
            role: user.role,
        },
    });
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
            // signature: user.role === roletypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN,
        });

        const refreshToken = generatetoken({
            payload: { id: user._id },
            // signature: user.role === roletypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN,
            expiresIn: "365d"
        });

        return successresponse(res, "Email confirmed successfully", 200, { access_Token, refreshToken });
    }
);


export const resendOTP = asyncHandelr(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new Error("❌ يجب إدخال البريد الإلكتروني!", { cause: 400 }));
    }

    const user = await Usermodel.findOne({ email });
    if (!user) {
        return next(new Error("❌ البريد الإلكتروني غير موجود!", { cause: 404 }));
    }

    if (user.isConfirmed) {
        return next(new Error("✅ البريد الإلكتروني تم تأكيده بالفعل!", { cause: 400 }));
    }

    // ✅ إرسال الحدث (هيستخدم الكود اللي انت كتبته بالفعل)
    Emailevent.emit("confirmemail", { email });

    return successresponse(res, "✅ تم إعادة إرسال رمز التحقق بنجاح!", 200);
});


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
        // signature: user.role === roletypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN,
    });

    const refreshToken = generatetoken({
        payload: { id: user._id },
        // signature: user.role === roletypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN,
        expiresIn: "365d"
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


export const GetFriendsList = asyncHandelr(async (req, res, next) => {
    const user = await Usermodel.findById(req.user._id)
        .populate({
            path: "friends",
            select: "username image", // هنجيب بس الاسم والصورة
            populate: {
                path: "image",
                select: "image.secure_url"
            }
        });

    if (!user) {
        return next(new Error("User not found", { cause: 404 }));
    }

    // تنسيق البيانات المستخرجة
    const friendsData = user.friends.map(friend => ({
        _id: friend._id,
        username: friend.username,
        image: friend.image?.image?.secure_url || null
    }));

    return successresponse(res, {
        friends: friendsData
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

export const createSupject = asyncHandelr(async (req, res, next) => {
    const { name, classId } = req.body;

    if (!name) {
        return next(new Error("❌ الاسم مطلوب", { cause: 400 }));
    }

  
    const newClass = await SubjectModel.create({ name, classId });

    res.status(201).json({
        message: "✅ تم إنشاء  الماده بنجاح",

    });
});
export const getAllClasses = asyncHandelr(async (req, res) => {
    const classes = await ClassModel.find().sort({ createdAt: -1 }); // أحدث صف في الأول

    res.status(200).json({
        message: "✅ تم جلب الصفوف الدراسية بنجاح",
        classes
    });
});




export const addQuestion = asyncHandelr(async (req, res, next) => {
    const { title, options, correctAnswer, mark, subject: subjectId, class: classId } = req.body;

   
    if (!title || !options || !correctAnswer || !mark || !subjectId || !classId) {
        return next(new Error("❌ كل الحقول مطلوبة", { cause: 400 }));
    }

    const question = await QuestionModel.create({
        title,
        options,
        correctAnswer,
        mark,
        subject: subjectId,
        class: classId
    });

    return successresponse(res, "✅ تم إضافة السؤال بنجاح", 201,);
});





export const submitAnswer = asyncHandelr(async (req, res, next) => {
    const { questionId, selectedAnswer } = req.body;
    const userId = req.user._id;

    // 1. تأكد من وجود السؤال
    const question = await QuestionModel.findById(questionId);
    if (!question) {
        return next(new Error("❌ السؤال غير موجود", { cause: 404 }));
    }

    // 2. تحقق إذا كان المستخدم جاوب على السؤال قبل كده
    const existingAnswer = await AnswerModel.findOne({
        user: userId,
        question: questionId
    });

    if (existingAnswer) {
        return successresponse(res, "✅ تم تسجيل إجابتك، ولكنك أجبت على هذا السؤال من قبل، لن يتم احتساب الدرجة مرة أخرى", 200);
    }

    // 3. تحقق هل الإجابة صحيحة
    const isCorrect = question.correctAnswer === selectedAnswer;
    const mark = isCorrect ? parseInt(question.mark) : 0;

    // 4. سجل الإجابة
    await AnswerModel.create({
        user: userId,
        question: question._id,
        selectedAnswer,
        isCorrect
    });
    await QuestionModel.findByIdAndUpdate(questionId, { isAnswer: true });
    // 5. تحديث النقاط
    if (isCorrect) {
        await PointModel.findOneAndUpdate(
            { user: userId },
            { $inc: { totalPoints: mark } },
            { upsert: true, new: true }
        );

        await RankModel.findOneAndUpdate(
            { user: userId, class: question.class },
            { $inc: { totalPoints: mark } },
            { upsert: true, new: true }
        );
    }
    return successresponse(res, {
        success: true,
        message: `✅ تم تسجيل إجابتك ${isCorrect ? 'وحصلت على ' + mark + ' درجة' : 'ولكنها غير صحيحة'}`
    }, 200);

});



export const getMyRank = asyncHandelr(async (req, res, next) => {
    const userId = req.user._id;

    // جلب بيانات الترتيب الخاصة بالطالب
    const myRankData = await RankModel.findOne({ user: userId }).populate("class");
    if (!myRankData) {
        return next(new Error("❌ لم يتم العثور على بيانات الترتيب الخاصة بك", { cause: 404 }));
    }

    // جلب بيانات المستخدم مع الصورة
    const userData = await Usermodel.findById(userId).populate({
        path: "image",
        select: "secure_url"
    });

    if (!userData) {
        return next(new Error("❌ المستخدم غير موجود", { cause: 404 }));
    }

    // جلب جميع الطلاب في نفس الصف وترتيبهم بناءً على النقاط تنازليًا
    const allRanksInClass = await RankModel.find({ class: myRankData.class._id }).sort({ totalPoints: -1 });

    // حساب الترتيب الخاص بالمستخدم
    const rankPosition = allRanksInClass.findIndex(rank => rank.user.toString() === userId.toString()) + 1;

    return successresponse(res, {
        rank: {
            username: req.user.username,
            userId: req.user.userId,
            class: myRankData.class.name,
            totalPoints: myRankData.totalPoints,
            image: userData.image?.secure_url || userData.image?.image?.secure_url || null, // ✅ يعالج الحالتين
            position: rankPosition,
        }
    });
});





export const getQuestionsByClassAndSubject = asyncHandelr(async (req, res, next) => {
    const { classId, subjectId } = req.body;

    if (!classId || !subjectId) {
        return next(new Error("❌ يجب إرسال classId و subjectId في الرابط", { cause: 400 }));
    }

    const questions = await QuestionModel.find({
        class: classId,
        subject: subjectId,
        $or: [
            { isAnswer: false },
            { isAnswer: { $exists: false } }
        ]
    }).select("title options"); // نرجّع فقط عنوان السؤال والاختيارات

    return res.status(200).json({
        success: true,
        message: "✅ تم جلب الأسئلة بنجاح حسب الصف والمادة",
        data: questions
    });
});


export const getSubjectsByClass = asyncHandelr(async (req, res, next) => {
  const { classId } = req.params;

  if (!classId) {
    return next(new Error("❌ يجب تحديد الصف الدراسي", { cause: 400 }));
  }

    const subjects = await SubjectModel.find({ classId: classId });

  return res.status(200).json({
    message: "✅ تم جلب المواد الدراسية بنجاح",
    subjects
  });
});





export const adduser = asyncHandelr(async (req, res, next) => {
    const { friendId } = req.params
    const friend = await dbservice.findOneAndUpdate({

        model: Usermodel,
        filter: {
            _id: friendId,

        },
        data: {

            $addToSet: { friends: req.user._id }
        },
        options: {
            new: true,
        }

    })

    if (!friend) {

        return next(new Error("invalied-friendId", { cause: 404 }))

    }
    const user = await dbservice.findOneAndUpdate({

        model: Usermodel,
        filter: {
            _id: req.user._id,
            isDeleted: false,

        },
        data: {

            $addToSet: { friends: friendId }
        },
        options: {
            new: true,
        }
    })


    return successresponse(res,);
});






export const getAllRanks = asyncHandelr(async (req, res, next) => {
    const allRanks = await RankModel.find()
        .sort({ totalPoints: -1 })
        .populate("class")
        .populate({
            path: "user",
            select: "username image",
            populate: {
                path: "image",
                select: "image.secure_url"
            }
        });

    const rankedUsers = allRanks
        .filter(rank => rank.user !== null)
        .map((rank, index) => ({
            username: rank.user.username,
            userId: rank.user._id,
            class: rank.class?.name || null,
            totalPoints: rank.totalPoints,
            position: index + 1,
            image: rank.user.image?.image?.secure_url || null
        }));

    return successresponse(res, {
        count: rankedUsers.length,
        students: rankedUsers
    });
});




// CIENT_ID = '221980279766-k063a77vogpfreoegb4nui67olml16he.apps.googleusercontent.com'


// utils/countryPricing.js

  