import Usermodel, { providerTypes, roletypes } from "../../../DB/models/User.model.js";
import * as dbservice from "../../../DB/dbservice.js"
import { asyncHandelr } from "../../../utlis/response/error.response.js";
import { comparehash, generatehash } from "../../../utlis/security/hash.security.js";
import { successresponse } from "../../../utlis/response/success.response.js";
import {  decodedToken,  generatetoken,  tokenTypes } from "../../../utlis/security/Token.security.js";
import { Emailevent } from "../../../utlis/events/email.emit.js";
import { OAuth2Client } from "google-auth-library";
import axios from 'axios';
import { nanoid, customAlphabet } from "nanoid";
import { vervicaionemailtemplet } from "../../../utlis/temblete/vervication.email.js";
import { sendemail } from "../../../utlis/email/sendemail.js";
import { Folder } from "../../../DB/models/foldeer.model.js";
import cloud from "../../../utlis/multer/cloudinary.js"
export const login = asyncHandelr(async (req, res, next) => {
    const { email, password } = req.body;
    console.log(email, password);

    const checkUser = await Usermodel.findOne({ email });
    if (!checkUser) {
        return next(new Error("User not found", { cause: 404 }));
    }

    if (checkUser?.provider === providerTypes.google) {
        return next(new Error("Invalid account", { cause: 404 }));
    }

    if (!checkUser.isConfirmed) {
        return next(new Error("Please confirm your email tmm ", { cause: 404 }));
    }

    if (!comparehash({ planText: password, valuehash: checkUser.password })) {
        return next(new Error("Password is incorrect", { cause: 404 }));
    }

    const access_Token = generatetoken({
        payload: { id: checkUser._id, role: checkUser.role },


    });

    const refreshToken = generatetoken({
        payload: { id: checkUser._id, role: checkUser.role, country: checkUser.country },
  
        expiresIn:"365d"
    });

    return successresponse(res, "Done", 200, { access_Token, refreshToken, checkUser });
});
// export const loginwithGmail = asyncHandelr(async (req, res, next) => {
//     const { idToken } = req.body;
//     const client = new OAuth2Client();

//     async function verify() {
//         const ticket = await client.verifyIdToken({
//             idToken,
//             audience: process.env.CIENT_ID,
//         });
//         return ticket.getPayload();
//     }

//     const payload = await verify();
//     console.log("Google Payload Data:", payload);

//     const { name, email, email_verified, picture } = payload;

//     if (!email) {
//         return next(new Error("Email is missing in Google response", { cause: 400 }));
//     }
//     if (!email_verified) {
//         return next(new Error("Email not verified", { cause: 404 }));
//     }

//     let user = await dbservice.findOne({
//         model: Usermodel,
//         filter: { email },
//     });

//     if (user?.provider === providerTypes.system) {
//         return next(new Error("Invalid account", { cause: 404 }));
//     }

//     if (!user) {
//         user = await dbservice.create({
//             model: Usermodel,
//             data: {
//                 email,
//                 username: name,
//                 profilePic: { secure_url: picture },
//                 isConfirmed: email_verified,
//                 provider: providerTypes.google,
//             },
//         });
//     }

//     const access_Token = generatetoken({
//         payload: { id: user._id },
//         signature: user?.role === roletypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN,
//     });

//     const refreshToken = generatetoken({
//         payload: { id: user._id },
//         signature: user?.role === roletypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN,
//         expiresIn: 31536000,
//     });
//     return successresponse(res, "Login successful", 200, { access_Token, refreshToken })

// });

export const refreshToken = asyncHandelr(async (req, res, next) => {

    const user = await decodedToken({ authorization: req.headers.authorization, tokenType: tokenTypes.refresh })

    const accessToken = generatetoken({
        payload: { id: user._id },
        signature: user.role === 'Admin' ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN,
    });

    // 7. إنشاء refresh token جديد
    const newRefreshToken = generatetoken({
        payload: { id: user._id },
        signature: user.role === 'Admin' ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN,
        expiresIn: 31536000, // سنة واحدة
    });

    // 8. إرجاع الرد الناجح
    return successresponse(res, "Token refreshed successfully", 200, { accessToken, refreshToken: newRefreshToken });
});




// export const loginwithGmail = asyncHandelr(async (req, res, next) => {
//     const { accessToken } = req.body;

//     if (!accessToken) {
//         return next(new Error("Access token is required", { cause: 400 }));
//     }

//     // Step 1: Get user info from Google
//     let userInfo;
//     try {
//         const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
//             headers: {
//                 Authorization: `Bearer ${accessToken}`,
//             },
//         });
//         userInfo = response.data;
//     } catch (error) {
//         console.error("Failed to fetch user info from Google:", error?.response?.data || error.message);
//         return next(new Error("Failed to verify access token with Google", { cause: 401 }));
//     }

//     const { email, name, picture, email_verified } = userInfo;

//     if (!email) {
//         return next(new Error("Email is missing in Google response", { cause: 400 }));
//     }
//     if (!email_verified) {
//         return next(new Error("Email not verified", { cause: 403 }));
//     }


//     let user = await dbservice.findOne({
//         model: Usermodel,
//         filter: { email },
//     });

//     if (user?.provider === providerTypes.system) {
//         return next(new Error("Invalid account. Please login using your email/password", { cause: 403 }));
//     }

    
//     if (!user) {
//         let userId;
//         let isUnique = false;
//         while (!isUnique) {
//             userId = Math.floor(1000000 + Math.random() * 9000000);
//             const existingUser = await dbservice.findOne({
//                 model: Usermodel,
//                 filter: { userId },
//             });
//             if (!existingUser) isUnique = true;
//         }

//         user = await dbservice.create({
//             model: Usermodel,
//             data: {
//                 email,
//                 username: name,
//                 profilePic: { secure_url: picture },
//                 isConfirmed: email_verified,
//                 provider: providerTypes.google,
//                 userId, // ✅ Add generated userId here
//                 gender: "Male", // لو تقدر تجيبه من جوجل أو تخليه undefined
//             },
//         });
//     }

//     // Step 4: Generate tokens
//     const access_Token = generatetoken({
//         payload: { id: user._id, country: user.country },
//     });

//     const refreshToken = generatetoken({
//         payload: { id: user._id },
//         expiresIn: "365d"
//     });

//     return successresponse(res, "Done", 200, { access_Token, refreshToken, user });
// });




export const loginwithGmail = asyncHandelr(async (req, res, next) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        return next(new Error("Access token is required", { cause: 400 }));
    }

    // ✅ Step 1: Get user info from Google
    let userInfo;
    try {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        userInfo = response.data;
    } catch (error) {
        console.error("Failed to fetch user info from Google:", error?.response?.data || error.message);
        return next(new Error("Failed to verify access token with Google", { cause: 401 }));
    }

    const { email, name, picture, email_verified } = userInfo;

    if (!email) {
        return next(new Error("Email is missing in Google response", { cause: 400 }));
    }
    if (!email_verified) {
        return next(new Error("Email not verified", { cause: 403 }));
    }

    // ✅ Step 2: Check if user exists
    let user = await dbservice.findOne({
        model: Usermodel,
        filter: { email },
    });

    if (user?.provider === providerTypes.system) {
        return next(new Error("Invalid account. Please login using your email/password", { cause: 403 }));
    }

    // ✅ Step 3: If new user, create user & generate referral link
    if (!user) {
        let userId;
        let isUnique = false;
        while (!isUnique) {
            userId = Math.floor(1000000 + Math.random() * 9000000);
            const existingUser = await dbservice.findOne({
                model: Usermodel,
                filter: { userId },
            });
            if (!existingUser) isUnique = true;
        }

        user = await dbservice.create({
            model: Usermodel,
            data: {
                email,
                username: name,
                profilePic: { secure_url: picture },
                isConfirmed: email_verified,
                provider: providerTypes.google,
                userId,
                gender: "Male",
            },
        });

        // ✅ توليد رابط إحالة تلقائي
        const referralLink = `https://mega-box.vercel.app/register?ref=${user._id}`;
        user.referralLink = referralLink;
        await user.save();
    }

    // ✅ Step 4: Generate tokens
    const access_Token = generatetoken({
        payload: { id: user._id, country: user.country },
    });

    const refreshToken = generatetoken({
        payload: { id: user._id },
        expiresIn: "365d"
    });

    return successresponse(res, "Done", 200, { access_Token, refreshToken, user });
});






export const forgetpassword = asyncHandelr(async (req, res, next) => {
    const { email } = req.body;
    console.log(email);

    // ✅ التحقق من إدخال البريد الإلكتروني
    if (!email) {
        return next(new Error("❌ يجب إدخال البريد الإلكتروني", { cause: 400 }));
    }

    // ✅ البحث عن المستخدم بالبريد
    const checkUser = await Usermodel.findOne({ email });
    if (!checkUser) {
        return next(new Error("❌ المستخدم غير موجود", { cause: 404 }));
    }

    try {
        // ✅ توليد كود OTP من 4 أرقام
        const otp = customAlphabet("0123456789", 6)();

        // ✅ إنشاء قالب البريد
        const html = vervicaionemailtemplet({ code: otp });

        // ✅ تشفير الكود
        const hashedOtp = await generatehash({ planText: otp });

        // ✅ تحديد مدة صلاحية الكود (10 دقائق)
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // ✅ حفظ بيانات الـ OTP في المستخدم
        await Usermodel.updateOne(
            { _id: checkUser._id },
            { emailOTP: hashedOtp, otpExpiresAt, attemptCount: 0 }
        );

        // ✅ إرسال الإيميل بالكود
        await sendemail({
            to: email,
            subject: "🔐 استعادة كلمة المرور",
            text: "رمز استعادة كلمة المرور",
            html,
        });

        console.log(`📩 تم إرسال كود استعادة كلمة المرور إلى البريد: ${email}`);

        return res.json({
            success: true,
            message: "✅ تم إرسال كود التحقق إلى البريد الإلكتروني",
            user: checkUser,
        });
    } catch (error) {
        console.error("❌ فشل في إرسال كود عبر البريد:", error.message);
        return res.status(500).json({
            success: false,
            error: "❌ فشل في إرسال كود التحقق عبر البريد",
            details: error.message,
        });
    }
});


export const resetpassword = asyncHandelr(async (req, res, next) => {
    const { email, code, password } = req.body;

    // ✅ التحقق من وجود البيانات المطلوبة
    if (!email || !code || !password) {
        return next(new Error("❌ برجاء إدخال البريد الإلكتروني + كود التحقق + كلمة المرور الجديدة", { cause: 400 }));
    }

    // ✅ البحث عن المستخدم بالبريد
    const user = await Usermodel.findOne({ email });
    if (!user) {
        return next(new Error("❌ المستخدم غير موجود", { cause: 404 }));
    }

    // ✅ التأكد أن هناك كود تحقق تم إرساله مسبقًا
    if (!user.emailOTP) {
        return next(new Error("❌ لم يتم إرسال كود تحقق لهذا الحساب", { cause: 400 }));
    }

    // ✅ التأكد من أن الكود لم تنتهِ صلاحيته
    if (Date.now() > new Date(user.otpExpiresAt).getTime()) {
        return next(new Error("❌ انتهت صلاحية كود التحقق", { cause: 400 }));
    }

    // ✅ مقارنة الكود المدخل بالكود المشفر
    const isValidOTP = await comparehash({ planText: `${code}`, valuehash: user.emailOTP });
    if (!isValidOTP) {
        // ⚠️ في حالة الخطأ، يتم زيادة عدد المحاولات
        const attempts = (user.attemptCount || 0) + 1;
        if (attempts >= 5) {
            await Usermodel.updateOne({ email }, {
                blockUntil: new Date(Date.now() + 2 * 60 * 1000), // حظر مؤقت لمدة دقيقتين
                attemptCount: 0,
            });
            return next(new Error("🚫 تم حظرك مؤقتًا بعد محاولات خاطئة كثيرة", { cause: 429 }));
        }

        await Usermodel.updateOne({ email }, { attemptCount: attempts });
        return next(new Error("❌ كود التحقق غير صحيح", { cause: 400 }));
    }

    // ✅ الكود صحيح — تحديث كلمة المرور
    const hashedPassword = await generatehash({ planText: password });

    await Usermodel.updateOne(
        { _id: user._id },
        {
            password: hashedPassword,
            isConfirmed: true,
            changeCredentialTime: Date.now(),
            $unset: {
                emailOTP: 0,
                otpExpiresAt: 0,
                attemptCount: 0,
                blockUntil: 0,
            },
        }
    );

    return successresponse(res, "✅ تم تغيير كلمة المرور بنجاح عبر البريد الإلكتروني", 200);
});



export const toggleUserBanByOwner = asyncHandelr(async (req, res, next) => {
    const { userId } = req.params;

    // ✅ تحقق إن المستخدم اللي بيطلب هو Owner
    const requester = await Usermodel.findById(req.user._id);
    if (!requester || requester.role !== "Owner") {
        return res.status(403).json({ message: "❌ ليس لديك صلاحية تنفيذ هذا الإجراء." });
    }

    // ✅ تحقق إن المستخدم المستهدف موجود
    const targetUser = await Usermodel.findById(userId);
    if (!targetUser) {
        return res.status(404).json({ message: "❌ المستخدم غير موجود." });
    }

    // 🔁 عكس حالة الحظر
    targetUser.isBanned = !targetUser.isBanned;
    await targetUser.save();

    res.status(200).json({
        message: targetUser.isBanned
            ? "✅ تم حظر المستخدم بنجاح"
            : "✅ تم فك الحظر عن المستخدم",
        userId: targetUser._id,
        isBanned: targetUser.isBanned,
    });
});

export const deleteUserById = asyncHandelr(async (req, res) => {
    const { userId } = req.params;

    // تحقق إن صاحب الطلب هو Owner
    const owner = await Usermodel.findById(req.user._id);
    if (!owner || owner.role !== "Owner") {
        return res.status(403).json({ message: "❌ ليس لديك صلاحية الحذف." });
    }

    // تحقق من وجود المستخدم
    const targetUser = await Usermodel.findById(userId);
    if (!targetUser) {
        return res.status(404).json({ message: "❌ المستخدم غير موجود." });
    }

    // لا يمكن حذف الـ Owner نفسه
    if (targetUser._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: "❌ لا يمكنك حذف نفسك." });
    }

    // تنفيذ الحذف
    await Usermodel.findByIdAndDelete(userId);

    res.status(200).json({
        message: "✅ تم حذف المستخدم بنجاح.",
        deletedUserId: userId,
    });
});





// API لجلب إحصائيات المستخدمين
// API لجلب إحصائيات المستخدمين
export const getUserStats = asyncHandelr(async (req, res) => {
    try {
        // عدد كل المستخدمين
        const totalUsers = await Usermodel.countDocuments();

        // عدد المستخدمين المسجلين في آخر 30 يوم
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const usersLast30Days = await Usermodel.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
        });

        // عدد المستخدمين الذين لديهم isPromoter = true
        const promotersCount = await Usermodel.countDocuments({ isPromoter: true });

        // عدد المستخدمين الذين لديهم isBrimume = true
        const brimumeCount = await Usermodel.countDocuments({ isBrimume: true });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                usersLast30Days,
                promotersCount,
                brimumeCount,  // 👈 تمت إضافته
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
import archiver from 'archiver';
import File from "../../../DB/models/files.conrroller.js";
import { ZipFile } from "../../../DB/models/zipFileSchema.js";
import { PassThrough } from 'stream';



export const createZip = asyncHandelr(async (req, res) => {
    const userId = req.user._id;
    const { items, shared = false } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "❌ حدد ملفات أو مجلدات للZIP" });
    }

    // إنشاء archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    // دالة إضافة مجلد (نفس اللي عندك)
    const addFolderContents = async (folderId, basePath = '') => {
        const folder = await Folder.findById(folderId);
        if (!folder || folder.userId.toString() !== userId.toString()) return;

        const files = await File.find({ folderId });
        for (const file of files) {
            if (file.userId.toString() !== userId.toString()) continue;
            const response = await axios.get(file.url, { responseType: 'stream' });
            archive.append(response.data, { name: `${basePath}${file.fileName}` });
        }

        const subFolders = await Folder.find({ parentFolder: folderId });
        for (const sub of subFolders) {
            await addFolderContents(sub._id, `${basePath}${sub.name}/`);
        }
    };

    // إضافة العناصر
    for (const item of items) {
        if (item.type === 'file') {
            const file = await File.findById(item.id);
            if (!file || file.userId.toString() !== userId.toString()) continue;
            const response = await axios.get(file.url, { responseType: 'stream' });
            archive.append(response.data, { name: file.fileName });
        } else if (item.type === 'folder') {
            await addFolderContents(item.id, '');
        }
    }

    archive.finalize();

    // جمع الـ ZIP في buffer
    const chunks = [];
    for await (const chunk of passThrough) {
        chunks.push(chunk);
    }
    const zipBuffer = Buffer.concat(chunks);

    const fileSizeMB = Math.ceil(zipBuffer.length / (1024 * 1024));
    const zipFileName = `my-files-${Date.now()}.zip`;

    // رفع على Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloud.uploader.upload_stream(
            {
                resource_type: "raw",
                folder: "cloudbox/zips",
                type: "upload",              // ← مهم جدًا: "upload" مش "authenticated"
                access_mode: "public",
                public_id: `zip-${Date.now()}`,
                format: "zip"
            },
            (error, result) => error ? reject(error) : resolve(result)
        );
        uploadStream.end(zipBuffer);
    });

    // إنشاء رابط مشاركة لو مطلوب
    let sharedUrl = null;
    if (shared) {
        const uniqueId = nanoid(12);
        sharedUrl = `https://proplem-production.up.railway.app/shared-zip/${uniqueId}`;
    }

    // حفظ في الداتابيز
    const savedZip = await ZipFile.create({
        userId,
        fileName: zipFileName,
        fileSize: fileSizeMB,
        url: uploadResult.secure_url,
        shared,
        sharedUrl,
        items // نحفظ إيه جوا الـ ZIP
    });

    // إرسال الـ ZIP للتنزيل
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
    res.send(zipBuffer);

    // اختياري: ممكن ترجع JSON مع معلومات الـ ZIP لو عايز
    // بس الـ download أولوية
});



export const getMyZips = asyncHandelr(async (req, res) => {
    const userId = req.user._id;

    const myZips = await ZipFile.find({ userId })
        .sort({ createdAt: -1 }) // الأحدث أولاً
        .select('fileName fileSize url shared sharedUrl createdAt items'); // نختار الحقول المفيدة

    if (myZips.length === 0) {
        return res.status(200).json({
            message: "📭 لم تقم بإنشاء أي ملف ZIP بعد",
            zips: [],
            count: 0
        });
    }

    res.status(200).json({
        message: "✅ تم جلب ملفات ZIP بنجاح",
        count: myZips.length,
        zips: myZips
    });
});


export const downloadZip = asyncHandelr(async (req, res) => {
    const userId = req.user._id;
    const { zipId } = req.params;

    const zipFile = await ZipFile.findById(zipId);

    if (!zipFile) {
        return res.status(404).json({ message: "❌ ملف ZIP غير موجود" });
    }

    if (zipFile.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "❌ غير مصرح لك بتنزيل هذا الملف" });
    }

    // إعداد headers للتنزيل
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFile.fileName}"`);

    // جلب الـ ZIP من Cloudinary وإرساله مباشرة (streaming)
    const response = await axios.get(zipFile.url, {
        responseType: 'stream'
    });

    response.data.pipe(res);

    // معالجة الأخطاء أثناء الـ streaming
    response.data.on('error', (err) => {
        console.error("Error streaming ZIP:", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "❌ خطأ أثناء تنزيل الملف" });
        }
    });
});