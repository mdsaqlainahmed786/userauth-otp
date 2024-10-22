import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import z from 'zod';
const otpRouter = express.Router();
dotenv.config();
otpRouter.use(express.json());
const prisma = new PrismaClient();
const otpSchema = z.object({
    mobileNumber: z.string().min(10, "mobile number cannot be less than 10 digits").max(10, "mobile number cannot be more than 10 digits"),
    countryCode: z.string().min(2).max(4),
});

const verifyOtpSchema = z.object({
    mobileNumber: z.string().min(10, "mobile number cannot be less than 10 digits").max(10, "mobile number cannot be more than 10 digits"),
    otp: z.string().min(4, "OTP cannot be less than 4 digits").max(4, "OTP cannot be more than 4 digits"),
})

otpRouter.post('/send-otp', async (req, res) => {
    try {
        const otpData = otpSchema.safeParse(req.body);
        if (!otpData.success) {
            res.status(400).send(otpData.error.errors);
            return;
        }
        const existPhoneNum = await prisma.user.findFirst({
            where: {
                mobileNumber: otpData.data.mobileNumber
            }
        })
        if (existPhoneNum) {
            res.status(400).json({
                success: false,
                message: "Phone number already exists"
            });
            return
        }
        await prisma.user.create({
            data: {
                mobileNumber: otpData.data.mobileNumber
            }
        })
        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpString = otp.toString();
        await prisma.otp.create({
            data: {
                mobileNumber: otpData.data.mobileNumber,
                otp: otpString,
            }
        })
        //  console.log(otp);
        //  console.log(otpData);
        res.json({
            success: true,
            otp,
            message: "OTP sent successfully",
        })
    } catch (error) {
        console.error(error);
    }
});

otpRouter.post('/verify-otp', async (req: Request, res: Response) => {
    const verifyOtpData = verifyOtpSchema.safeParse(req.body);

    if (!verifyOtpData.success) {
        res.status(400).send(verifyOtpData.error.errors);
        return
    }

    const otpData = await prisma.otp.findFirst({
        where: {
            mobileNumber: verifyOtpData.data.mobileNumber,
            otp: verifyOtpData.data.otp,
        }
    });
    console.log(otpData)
    if (!otpData) {
        res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
        return
    }

    const accessToken = jwt.sign({ mobileNumber: verifyOtpData.data.mobileNumber }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "100d" });
    if (!accessToken) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return
    }
    res.cookie('accessToken', accessToken)
    console.log("access token cookie set!")
    const refreshToken = jwt.sign({ mobileNumber: verifyOtpData.data.mobileNumber }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" })
    if (!refreshToken) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return
    }
    res.cookie('refreshToken', refreshToken)
    console.log("refresh token cookie set!")
    const otpRecord = await prisma.otp.findFirst({
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
        return
    }

    await prisma.otp.delete({
        where: {
            id: otpRecord.id
        }
    })
    await prisma.user.update({
        where: {
            mobileNumber: verifyOtpData.data.mobileNumber
        },
        data: {
            refresh_Token: refreshToken,
            access_Token: accessToken
        }
    })
    console.log("The otp is deleted and the user is updated");
    // console.log("Token is this>>>>>>", token); ***Token is arriving here***

    res.json({
        success: true,
        refreshToken,
        accessToken,
        message: "OTP verified successfully"
    });
});
//@ts-ignore
otpRouter.get('/refresh-token', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: "No refresh token found"
        });
    }
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as {
        mobileNumber: string;
        iat: number;
        exp: number;
    };
    const accessToken = jwt.sign({ mobileNumber: decodedToken.mobileNumber }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });
    if (!accessToken) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
    res.clearCookie('accessToken');
    res.cookie('accessToken', accessToken);
    await prisma.user.update({
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
});


export { otpRouter };