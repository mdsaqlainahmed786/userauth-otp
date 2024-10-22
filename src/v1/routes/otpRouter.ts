import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import z from 'zod';
const otpRouter = express.Router();
otpRouter.use(express.json());
const prisma = new PrismaClient();
const otpSchema = z.object({
    mobileNumber: z.string().min(10, "mobile number cannot be less than 10 digits").max(10, "mobile number cannot be more than 10 digits"),
    countryCode: z.string().min(1).max(3),
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
        console.log(otp);
        console.log(otpData);
        res.json({
            success: true,
            otp,
            message: "OTP sent successfully",
        })
    } catch (error) {
        console.error(error);
    }
});
//@ts-ignore
otpRouter.post('/verify-otp', async (req: Request, res: Response) => {
    const verifyOtpData = verifyOtpSchema.safeParse(req.body);
    
    if (!verifyOtpData.success) {
        return res.status(400).send(verifyOtpData.error.errors);
    }
 
    const otp = await prisma.otp.findFirst({
        where: {
            mobileNumber: verifyOtpData.data.mobileNumber,
            otp: verifyOtpData.data.otp,
        }
    });
 
    if (!otp) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
    }
 
    res.json({
        success: true,
        message: "OTP verified successfully"
    });
 });


export { otpRouter };