import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import z from 'zod';
const userRouter: Router = express.Router();
userRouter.use(express.json());
interface AuthenticatedRequest extends Request {
    user?: {
        mobileNumber: string;
        iat: number;
        exp: number;
    }
}
const userSchema = z.object({
    name: z.string().min(3, "Name cannot be less than 3 characters"),
    email: z.string().email("Invalid email"),
    company: z.string().min(3, "Company name cannot be less than 3 characters"),
    city: z.string().min(3, "City name cannot be less than 3 characters"),
})
const prisma = new PrismaClient();

userRouter.get('/get-user', async (req: AuthenticatedRequest, res: Response) => {
    const authenticatedUser = req as AuthenticatedRequest
    if (!authenticatedUser) { 
        res.status(400).json({ message: "The user is not authenticated!" })
         return
        }
    const mobileNumber = authenticatedUser.user?.mobileNumber;
    const user = await prisma.user.findUnique({
        where: {
            mobileNumber: mobileNumber
        },

    })
    res.status(200).json({
        success: true,
        message: "User found successfully",
        userName: user?.name,
        mobileNumber: user?.mobileNumber,
        email: user?.email,
        company: user?.company,
        city: user?.city

    })
});

 userRouter.post("/create-user", async (req: AuthenticatedRequest, res: Response) => {
    const authenticatedUser = req as AuthenticatedRequest
    if (!authenticatedUser) { 
        res.status(400).json({ message: "The user is not authenticated!" })
         return
        }
    const mobileNumber = authenticatedUser.user?.mobileNumber;
    const user = await prisma.user.findUnique({
        where: {
            mobileNumber: mobileNumber
        },

    })
       const userData = userSchema.safeParse(req.body);
        // console.log("UserData",userData)
        if (!userData.success) {
            res.status(400).send(userData.error.errors);
            return;
        }
    const newUser = await prisma.user.update({
        where:{
            mobileNumber: mobileNumber
        },
        data: {
            name: userData.data?.name,
            email: userData.data?.email,
            company: userData.data?.company,
            city: userData.data?.city
        }
    })
    res.status(200).json({
        success: true,
        message:"Profile created successfully",
        newUser
    })
 })
export { userRouter };