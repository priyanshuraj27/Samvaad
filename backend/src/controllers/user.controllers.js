import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Gamification } from "../models/gamification.models.js"; // <-- Add this import

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.accessToken = accessToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (!fullName || !email || !username || !password) {
    throw new ApiError(400, "Please provide all fields");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
  });

  // Create gamification record with 75 XP for the new user
  await Gamification.create({ user: user._id }); // xp defaults to 75

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "User not created");
  }

  // Changed: message and data placement
  return res.status(201).json(new ApiResponse(201, "User created", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Please provide username or email");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
  };

  // Changed: message and data placement
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(
      200,
      "User logged in",
      {
        user: loggedInUser,
        accessToken,
        refreshToken,
      }
    ));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = { httpOnly: true, secure: true };

  // Changed: message and data placement
  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out", undefined));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = { httpOnly: true, secure: true };

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Changed: message and data placement
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, "Access token refreshed", { accessToken, refreshToken: newRefreshToken }));
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Please provide all fields");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // Changed: message and data placement
  return res.status(200).json(new ApiResponse(200, "Password Changed Successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // Changed: message and data placement
  return res.status(200).json(new ApiResponse(200, "Current User Fetched Successfully", req.user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName } = req.body;

  if (!fullName) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName } },
    { new: true }
  ).select("-password");

  // Changed: message and data placement
  return res.status(200).json(new ApiResponse(200, "Account details updated successfully", user));
});

const isLoggedIn = asyncHandler(async (req, res) => {
  const user = req.user;
  if(!user) {
    throw new ApiError(401, "Unauthorized request");
  }
  // Changed: message and data placement
  return res.status(200).json(new ApiResponse(200, "User is logged in", user));
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Changed: message and data placement
  return res.status(200).json(new ApiResponse(200, "User deleted successfully", {}));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  isLoggedIn,
  deleteUser,
};
