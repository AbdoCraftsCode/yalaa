// import nodemailer from "nodemailer"




// export const sendemail = async ({
//     to = [],
//     subject = "",
//     text = "",
//     html = "",
//     attachments = [],


// } = {}) => {




//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: process.env.EMAIL,
//             pass: process.env.EMAIL_PASSWORD,
//         },
        

//             tls: {
//                 rejectUnauthorized: false // 💥 ده بيسمح باستخدام شهادات SSL موقعة ذاتيًا
//             }
        
//     });



//     const info = await transporter.sendMail({
//         from: `"yallabina 👻" <${process.env.EMAIL}>`,
//         to,
//         subject,
//         text,
//         html,
//         attachments,
//     });



// }



import nodemailer from "nodemailer";

export const sendemail = async ({
    to = [],
    subject = "",
    text = "",
    html = "",
    attachments = [],
} = {}) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.mailersend.net",
        port: 587, // أو 2525
        secure: false, // true لو كنت هتستخدم port 465
        auth: {
            user: process.env.SMTP_USER, // SMTP username
            pass: process.env.SMTP_PASS, // SMTP password
        },
        tls: {
            rejectUnauthorized: false, // لحل مشكلة الشهادة في بيئات التطوير
        },
    });

    const info = await transporter.sendMail({
        from: `"YallaBina 👻" <${process.env.SENDER_EMAIL}>`, // لازم يكون من دومينك
        to,
        subject,
        text,
        html,
        attachments,
    });

    console.log("✅ الإيميل تم إرساله:", info.messageId);
};



