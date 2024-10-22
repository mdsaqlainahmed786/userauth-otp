import express, { Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?:{
    mobileNumber: string;
    iat: number;
    exp: number;
  }
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authCookie = req.cookies?.accessToken
  //  console.log(authCookie)
    if (!authCookie) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
      return;
    }
    const decodedToken = jwt.verify(authCookie, process.env.ACCESS_TOKEN_SECRET as string) as {
      mobileNumber: string;
      iat: number;
      exp: number;
    };
    if (!decodedToken) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
      return;
    }
    req.user = decodedToken
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token or something went wrong"
    })
  }
    

};
