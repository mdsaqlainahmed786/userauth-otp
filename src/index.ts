import express from 'express';
import { userRouter } from './v1/routes/userRouter';
import { otpRouter } from './v1/routes/otpRouter';
import { authMiddleware } from './middlewares/authMiddleware';
import cookieParser from 'cookie-parser';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1/users", authMiddleware, userRouter)
app.use("/api/v1/otp", otpRouter)

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});