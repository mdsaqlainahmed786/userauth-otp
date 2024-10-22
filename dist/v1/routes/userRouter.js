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
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const zod_1 = __importDefault(require("zod"));
const userRouter = express_1.default.Router();
exports.userRouter = userRouter;
userRouter.use(express_1.default.json());
const userSchema = zod_1.default.object({
    name: zod_1.default.string().min(3, "Name cannot be less than 3 characters"),
    email: zod_1.default.string().email("Invalid email"),
    company: zod_1.default.string().min(3, "Company name cannot be less than 3 characters"),
    city: zod_1.default.string().min(3, "City name cannot be less than 3 characters"),
});
const prisma = new client_1.PrismaClient();
userRouter.get('/get-user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authenticatedUser = req;
    if (!authenticatedUser) {
        res.status(400).json({ message: "The user is not authenticated!" });
        return;
    }
    const mobileNumber = (_a = authenticatedUser.user) === null || _a === void 0 ? void 0 : _a.mobileNumber;
    const user = yield prisma.user.findUnique({
        where: {
            mobileNumber: mobileNumber
        },
    });
    res.status(200).json({
        success: true,
        message: "User found successfully",
        userName: user === null || user === void 0 ? void 0 : user.name,
        mobileNumber: user === null || user === void 0 ? void 0 : user.mobileNumber,
        email: user === null || user === void 0 ? void 0 : user.email,
        company: user === null || user === void 0 ? void 0 : user.company,
        city: user === null || user === void 0 ? void 0 : user.city
    });
}));
userRouter.post("/create-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e, _f;
    const authenticatedUser = req;
    if (!authenticatedUser) {
        res.status(400).json({ message: "The user is not authenticated!" });
        return;
    }
    const mobileNumber = (_b = authenticatedUser.user) === null || _b === void 0 ? void 0 : _b.mobileNumber;
    const user = yield prisma.user.findUnique({
        where: {
            mobileNumber: mobileNumber
        },
    });
    const userData = userSchema.safeParse(req.body);
    // console.log("UserData",userData)
    if (!userData.success) {
        res.status(400).send(userData.error.errors);
        return;
    }
    const newUser = yield prisma.user.update({
        where: {
            mobileNumber: mobileNumber
        },
        data: {
            name: (_c = userData.data) === null || _c === void 0 ? void 0 : _c.name,
            email: (_d = userData.data) === null || _d === void 0 ? void 0 : _d.email,
            company: (_e = userData.data) === null || _e === void 0 ? void 0 : _e.company,
            city: (_f = userData.data) === null || _f === void 0 ? void 0 : _f.city
        }
    });
    res.status(200).json({
        success: true,
        message: "Profile created successfully",
        newUser
    });
}));
