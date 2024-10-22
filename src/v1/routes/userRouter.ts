import express from 'express';
const userRouter = express.Router();
userRouter.use(express.json());

userRouter.get('/', (req, res) => {
    res.json({ message: "User router is working" });
});

export { userRouter };