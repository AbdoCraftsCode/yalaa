

// import multer from "multer";


// export const fileValidationTypes = {
//     image: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
//     document: ['application/json', 'application/pdf'],
// };


// export const uploadCloudFile = (fileValidation = []) => {



//     const storage = multer.diskStorage({});



//     function fileFilter(req, file, cb) {
//         if (fileValidation.includes(file.mimetype)) {
//             cb(null, true);
//         } else {
//             cb(new Error("❌ الملف غير مدعوم!"), false);
//         }
//     }

//     return multer({ storage, fileFilter });
// };

// src/middlewares/multer.middleware.js
// src/utils/multer.js
import multer from "multer";

// export const fileValidationTypes = {
//     image: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
//     video: ['video/mp4', 'video/mpeg', 'video/x-msvideo'],
//     document: ['application/json', 'application/pdf', 'application/zip', 'application/x-zip-compressed'],
//     any: [
//         'image/jpg', 'image/jpeg', 'image/png', 'image/gif',
//         'video/mp4', 'video/mpeg', 'video/x-msvideo',
//         'application/json', 'application/pdf',
//         'application/zip', 'application/x-zip-compressed'
//     ]
// };
export const fileValidationTypes = {
    image: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
    video: ['video/mp4', 'video/mpeg', 'video/x-msvideo'],
    document: [
        'application/json',
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'text/csv' // ✅ أضف هذا
    ],
    any: [
        'image/jpg', 'image/jpeg', 'image/png', 'image/gif',
        'video/mp4', 'video/mpeg', 'video/x-msvideo',
        'application/json', 'application/pdf',
        'application/zip', 'application/x-zip-compressed',
        'text/csv' // ✅ أضف هذا أيضًا
    ]
};

export const uploadCloudFile = (fileValidation = []) => {
    const storage = multer.diskStorage({});

    function fileFilter(req, file, cb) {
        if (fileValidation.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("❌ الملف غير مدعوم!"), false);
        }
    }

    return multer({
        storage,
        limits: { fileSize: 1024 * 1024 * 1000 }, // أقصى حجم 1000MB
        fileFilter
    });
};
