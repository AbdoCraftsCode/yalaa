


import jwt from "jsonwebtoken"

import Usermodel from "../../DB/models/User.model.js"
import * as dbservice from "../../DB/dbservice.js"


export const tokenTypes = {
    access: "access",
    refresh: "refresh"
};

export const decodedToken = async ({ authorization = "", tokenType = tokenTypes.access, next } = {}) => {
    // 1. التحقق من وجود الهيدر
    if (!authorization) {
        return next(new Error("Authorization header is required", { cause: 400 }));
    }

    // 2. تقسيم الهيدر إلى bearer و token
    const [bearer, token] = authorization.split(" ") || [];
    if (!bearer || !token) {
        return next(new Error("Invalid authorization format", { cause: 400 }));
    }

    // 3. تحديد التوقيع بناءً على نوع الـ bearer
    let accesssignature = "";
    let refreshsignature = "";
    switch (bearer) {
        case 'System':
            accesssignature = process.env.SYSTEM_ACCESS_TOKEN;
            refreshsignature = process.env.SYSTEM_REFRESH_TOKEN;
            break;
        case 'Bearer':
            accesssignature = process.env.USER_ACCESS_TOKEN;
            refreshsignature = process.env.USER_REFRESH_TOKEN;
            break;
        default:
            return next(new Error("Invalid bearer type", { cause: 400 }));
    }

    // 4. التحقق من صحة الـ token
    const decoded = verifytoken({
        token,
        signature: tokenType === tokenTypes.access ? accesssignature : refreshsignature
    });
    if (!decoded?.id) {
        return next(new Error("Invalid token", { cause: 401 }));
    }

    // 5. البحث عن المستخدم في قاعدة البيانات
    const user = await dbservice.findOne({
        model: Usermodel,
        filter: { _id: decoded.id,  }
    });
    if (!user) {
        return next(new Error("User not found", { cause: 404 }));
    }

    // 6. التحقق من تغيير بيانات الاعتماد
    if (user.changecredintialTime?.getTime() >= decoded.iat * 1000) {

    }

    return user;
};


export const generatetoken = ({ payload = {}, signature = process.env.USER_ACCESS_TOKEN, expiresIn = parseInt(process.env.expiresIn) } = {}) => {
    const token = jwt.sign(payload, signature, { expiresIn });
    return token;
};


export const verifytoken = ({ token = "", signature = process.env.USER_ACCESS_TOKEN } = {}) => {
    const decoded = jwt.verify(token, signature);
    return decoded;
};
