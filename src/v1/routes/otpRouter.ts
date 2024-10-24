import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { rateLimit } from 'express-rate-limit'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import z from 'zod';
const otpRouter = express.Router();
dotenv.config();
otpRouter.use(express.json());
const prisma = new PrismaClient();
// Added a rate limiter for not more than 5 sending otp requests in 1 minute
const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, 
	limit: 5,
	standardHeaders: 'draft-7', 
	legacyHeaders: false,
})
// Schema for requesting an OTP
const otpSchema = z.object({
    mobileNumber: z.string().min(10, "mobile number cannot be less than 10 digits").max(10, "mobile number cannot be more than 10 digits"),
    countryCode: z.string().min(2).max(4),
});
// Schema for verifying the OTP
const verifyOtpSchema = z.object({
    mobileNumber: z.string().min(10, "mobile number cannot be less than 10 digits").max(10, "mobile number cannot be more than 10 digits"),
    otp: z.string().min(4, "OTP cannot be less than 4 digits").max(4, "OTP cannot be more than 4 digits"),
})

otpRouter.post('/send-otp', limiter, async (req: Request, res: Response) => {
    try {
        // Getting the data from the request body
        const otpData = otpSchema.safeParse(req.body);
        if (!otpData.success) {
      res.status(400).send(otpData.error.errors);
      return;
         
        }
        // Checking if the phone number already exists
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
        // Creating a new user with the phone number
        await prisma.user.create({
            data: {
                mobileNumber: otpData.data.mobileNumber
            }
        })
        // Generating a random 4 digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpString = otp.toString();
        await prisma.otp.create({
            data: {
                mobileNumber: otpData.data.mobileNumber,
                otp: otpString,
            }
        })
        res.json({
            success: true,
            otp,
            message: "OTP sent successfully",
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

otpRouter.post('/verify-otp', async (req: Request, res: Response) => {
    // Getting the data from the request body
    const verifyOtpData = verifyOtpSchema.safeParse(req.body);

    if (!verifyOtpData.success) {
        res.status(400).send(verifyOtpData.error.errors);
        return
    }
     // Checking if the phone number already exists
    const otpData = await prisma.otp.findFirst({
        where: {
            mobileNumber: verifyOtpData.data.mobileNumber,
            otp: verifyOtpData.data.otp,
        }
    });
      // Checking if the OTP is valid
    if (!otpData) {
        res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
        return
    }
   // Generating access token and refresh token
    const accessToken = jwt.sign({ mobileNumber: verifyOtpData.data.mobileNumber }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "100d" });
    if (!accessToken) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return
    }
    // Setting the access token and refresh token as cookies
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
    // Deleting the OTP record
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
    // Updating the user with the refresh token and access token
    await prisma.user.update({
        where: {
            mobileNumber: verifyOtpData.data.mobileNumber
        },
        data: {
            refresh_Token: refreshToken,
            access_Token: accessToken
        }
    })

    res.json({
        success: true,
        refreshToken,
        accessToken,
        message: "OTP verified successfully"
    });
});
otpRouter.get('/refresh-token', async (req, res) => {
    try{
        // Getting the refresh token from the cookies
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        res.status(400).json({
            success: false,
            message: "No refresh token found"
        });
        return
    }
    // Verifying the refresh token
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as {
        mobileNumber: string;
        iat: number;
        exp: number;
    };
    // Generating a new access token
    const accessToken = jwt.sign({ mobileNumber: decodedToken.mobileNumber }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });
    if (!accessToken) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return
    }
    // Clearing the previous cookie and then setting the new access token as a cookie
    res.clearCookie('accessToken');
    res.cookie('accessToken', accessToken);
    // Updating the user with the new access token
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
} catch (error) {
    console.error(error);
    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
}
});


export { otpRouter };
