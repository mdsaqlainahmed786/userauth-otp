import express from 'express';
import { userRouter } from './v1/routes/userRouter';
import { otpRouter } from './v1/routes/otpRouter';
import cors from 'cors';
const app = express();
app.use(cors());

// Routes
app.use("/api/v1/users", userRouter)
app.use("/api/v1/otp", otpRouter)

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});