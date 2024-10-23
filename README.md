# The user auth which requires otp authentication using mobile number (Mock OTP)

## The TechStack:
1) Uses Node js with Express js for routing,
2) Docker container for local running of database of mySQL and ORM of prisma,
3) Uses Zod for validation and cookie parser for cookie
4) Uses TypeScript for strict types of variables
5) Uses nodemon
6) Otp Routes contains:(otpRouter)
   ### /send-otp
   Which sends otp on the provided mobileNumber, Protected from spamming by adding a rate limiter for only requests of 5 per minute
   ### /verify-otp
   Which verifies the otp, if valid removes the otp from db and gives out access token and refresh token, Stores them in the DB
   ### /refresh-token
   Refreshes the access token if expired and provides a new access token
7) ### MiddleWare:(authMiddleware)
   Gets the access token from the cookie and verifies it and then the returned decoded object is extended in Request Class
8) User Routes which are protected from the middleWare, contains:(UserRouter)
   ### /get-user
   Gets the user from the data base from the mobile number coming from the authMiddleware
   ### /create-user
   Can add name, email, company, city in the data base

## Steps to run a project
1) Git Clone it or fork the project
2) Then run `npm i` to install all dependencies
3) Then run `npm run dev` which has dev script of `npx tsc -b && nodemon dist/index.js`
4) Make sure you have a mySQL data base running using docker or any provider. And update the data_base url
## In my case to run the docker mySQL locally we have to run in terminal
 1) Pull the mysql image from dockerhub

        docker pull mysql
    
 3)  Then create a container by giving it a name and providing a password with port mapping

         docker run --name mysql-db -e MYSQL_ROOT_PASSWORD=pw -p 3306:3306 -d mysql

 4) Once the container is running, run this command

        docker exec -it mysql-container mysql -u root -p
    
 6) Enter the password and then, your mysql data base is now running live locally!
    

