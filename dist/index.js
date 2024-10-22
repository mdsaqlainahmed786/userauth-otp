"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRouter_1 = require("./v1/routes/userRouter");
const otpRouter_1 = require("./v1/routes/otpRouter");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Routes
app.use("/api/v1/users", userRouter_1.userRouter);
app.use("/api/v1/otp", otpRouter_1.otpRouter);
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
