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
  console.log("MongoDB URL:", process.env.DB_URL);

  return await mongoose.connect(process.env.DB_URL).then(res => {

    console.log("✅ DB connected successfully");


  }).catch(error => {

    console.log("invalid-db", error);

  })

}
