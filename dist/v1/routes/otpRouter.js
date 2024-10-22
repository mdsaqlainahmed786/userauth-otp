"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpRouter = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const express_rate_limit_1 = require("express-rate-limit");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = __importDefault(require("zod"));
const otpRouter = express_1.default.Router();
exports.otpRouter = otpRouter;
dotenv_1.default.config();
otpRouter.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 1 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
const otpSchema = zod_1.default.object({
    mobileNumber: zod_1.default.string().min(10, "mobile number cannot be less than 10 digits").max(10, "mobile number cannot be more than 10 digits"),
    countryCode: zod_1.default.string().min(2).max(4),
});
const verifyOtpSchema = zod_1.default.object({
    mobileNumber: zod_1.default.string().min(10, "mobile number cannot be less than 10 digits").max(10, "mobile number cannot be more than 10 digits"),
    otp: zod_1.default.string().min(4, "OTP cannot be less than 4 digits").max(4, "OTP cannot be more than 4 digits"),
});
otpRouter.post('/send-otp', limiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const otpData = otpSchema.safeParse(req.body);
        if (!otpData.success) {
            res.status(400).send(otpData.error.errors);
            return;
        }
        const existPhoneNum = yield prisma.user.findFirst({
            where: {
                mobileNumber: otpData.data.mobileNumber
            }
        });
        if (existPhoneNum) {
            res.status(400).json({
                success: false,
                message: "Phone number already exists"
            });
            return;
        }
        yield prisma.user.create({
            data: {
                mobileNumber: otpData.data.mobileNumber
            }
        });
        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpString = otp.toString();
        yield prisma.otp.create({
            data: {
                mobileNumber: otpData.data.mobileNumber,
                otp: otpString,
            }
        });
        //  console.log(otp);
        //  console.log(otpData);
        res.json({
            success: true,
            otp,
            message: "OTP sent successfully",
        });
    }
    catch (error) {
        console.error(error);
    }
}));
otpRouter.post('/verify-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifyOtpData = verifyOtpSchema.safeParse(req.body);
    if (!verifyOtpData.success) {
        res.status(400).send(verifyOtpData.error.errors);
        return;
    }
    const otpData = yield prisma.otp.findFirst({
        where: {
            mobileNumber: verifyOtpData.data.mobileNumber,
            otp: verifyOtpData.data.otp,
        }
    });
    console.log(otpData);
    if (!otpData) {
        res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
        return;
    }
    const accessToken = jsonwebtoken_1.default.sign({ mobileNumber: verifyOtpData.data.mobileNumber }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "100d" });
    if (!accessToken) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return;
    }
    res.cookie('accessToken', accessToken);
    console.log("access token cookie set!");
    const refreshToken = jsonwebtoken_1.default.sign({ mobileNumber: verifyOtpData.data.mobileNumber }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    if (!refreshToken) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return;
    }
    res.cookie('refreshToken', refreshToken);
    console.log("refresh token cookie set!");
    const otpRecord = yield prisma.otp.findFirst({
        where: {
            mobileNumber: verifyOtpData.data.mobileNumber,
            otp: verifyOtpData.data.otp,
        }
    });
    if (!otpRecord) {
        res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
        return;
    }
    yield prisma.otp.delete({
        where: {
            id: otpRecord.id
        }
    });
    yield prisma.user.update({
        where: {
            mobileNumber: verifyOtpData.data.mobileNumber
        },
        data: {
            refresh_Token: refreshToken,
            access_Token: accessToken
        }
    });
    //console.log("The otp is deleted and the user is updated");
    // console.log("Token is this>>>>>>", token); ***Token is arriving here***
    res.json({
        success: true,
        refreshToken,
        accessToken,
        message: "OTP verified successfully"
    });
}));
otpRouter.get('/refresh-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        if (!refreshToken) {
            res.status(400).json({
                success: false,
                message: "No refresh token found"
            });
            return;
        }
        const decodedToken = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const accessToken = jsonwebtoken_1.default.sign({ mobileNumber: decodedToken.mobileNumber }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        if (!accessToken) {
            res.status(500).json({
                success: false,
                message: "Internal server error"
            });
            return;
        }
        res.clearCookie('accessToken');
        res.cookie('accessToken', accessToken);
        yield prisma.user.update({
            where: {
                mobileNumber: decodedToken.mobileNumber
            },
            data: {
                access_Token: accessToken
            }
        });
        res.json({
            success: true,
            accessToken,
            message: "Token refreshed successfully"
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}));
