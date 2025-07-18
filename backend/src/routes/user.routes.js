import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
} from "../controllers/user.controllers.js";    

import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

//  Public Routes 
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/refresh-token", refreshAccessToken);
userRouter.get("/is-logged-in", verifyJWT, (req, res) => {
  res.status(200).json({ message: "User is logged in" });
});

//  Protected Routes
userRouter.post("/logout", verifyJWT, logoutUser);
userRouter.post("/change-password", verifyJWT, changeCurrentPassword);
userRouter.get("/current-user", verifyJWT, getCurrentUser);
userRouter.patch("/update-account", verifyJWT, updateAccountDetails);
// userRouter.patch("/update-avatar", verifyJWT, upload.single("avatar"), updateUserAvatar);

export default userRouter;
