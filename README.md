# The user auth which requires otp authentication using mobile number (Mock OTP)

## The TechStack:
1) Uses Node js with Express js for routing,
2) Docker container for local running of database of mySQL and ORM of prisma,
3) Otp Routes contains:(otpRouter)
   ### /send-otp
  ->Which sends otp on the provided mobileNumber, Protected from spamming by adding a rate limiter for only requests of 5 per minute
   ### /verify-otp
  ->Which verifies the otp, if valid removes the otp from db and gives out access token and refresh token, Stores them in the DB
   ### /refresh-token
  ->Refreshes the access token if expired and provides a new access token
4) ### MiddleWare:(authMiddleware)
   =>gets the access token from the cookie and verifies it and then the returned decoded object is extended in Request Class
5) User Routes which are protected from the middleWare, contains:(UserRouter)
   ### /get-user
   -> Gets the user from the data base from the mobile number coming from the authMiddleware
   ### /create-user
   ->Can add name, email, company, city in the data base

