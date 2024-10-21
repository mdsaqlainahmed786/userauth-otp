import express from 'express';
const userRouter = express.Router();
userRouter.use(express.json());
userRouter.get('/', (req, res) => {
    res.send('This is user route');
});

export { userRouter };