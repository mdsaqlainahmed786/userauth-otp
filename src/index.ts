import express from 'express';
import { userRouter } from './v1/routes/userRouter';
import cors from 'cors';
const app = express();
app.use(cors());
app.use("/api/v1/users", userRouter)

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});