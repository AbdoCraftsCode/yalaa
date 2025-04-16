import express from "express"
import bootstap from "./src/app.controller.js"
import path from "node:path"
import dotenv from "dotenv"
dotenv.config({ path: path.resolve("./src/config/.env") })
// console.log("Database URL:", process.env.DB_URL);
import { Server } from "socket.io";

import { authenticationSocket, authorization } from "./src/middlewere/auth.socket.middlewere.js";
import { scketConnections } from "./src/DB/models/User.model.js";
import { disconnect } from "node:process";
import { runIo } from "./src/modules/chat/chat.socket.controller.js";


const app = express()
const port = process.env.PORT||3000

bootstap(app ,express)

app.get("/", (req, res) => {
    res.send("✅ Yalla Bina server is running!");
});


const httpServer = app.listen(port, () => {
    console.log(`server is runing on port ${port} mr abdo welcome`);
});


runIo(httpServer);