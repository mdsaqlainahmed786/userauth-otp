import express, { Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

// Interface for authenticated request
interface AuthenticatedRequest extends Request {
  user?:{
    mobileNumber: string;
    iat: number;
    exp: number;
  }
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Getting the access token from the cookies
    const authCookie = req.cookies?.accessToken
    if (!authCookie) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
      return;
    }
    // Verifying the access token
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
    // Setting the user in the request object
    req.user = decodedToken
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token or something went wrong"
    })
  }
    

};
