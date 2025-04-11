// import mongoose from "mongoose";

// export const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.DB_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
//     console.log("✅ DB connected successfully");
//   } catch (error) {
//     console.log("❌ DB connection error:", error);
//   }
// };


import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ DB connected successfully");
    } catch (error) {
        console.log("❌ DB connection error:", error);
    }
};
