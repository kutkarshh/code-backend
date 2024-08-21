import jwt from "jsonwebtoken";
import path from 'path';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Failed to generate access and refresh tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;
    const { avatar, coverImage } = req.files || {};

    // Validate user details
    if ([username, email, password, fullName].some(field => !field.trim())) {
        throw new ApiError(400, "Please fill all required fields");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        throw new ApiError(409, "User with this username or email already exists");
    }

    // Handle avatar upload
    if (!avatar || !avatar[0]) {
        throw new ApiError(400, "Please provide an avatar image");
    }

    const avatarLocalPath = avatar[0].path;
    const avatarFileName = path.basename(avatarLocalPath).split('.')[0]; // Use original filename
    // console.log(avatarLocalPath, avatarFileName);
    const avatarUpload = await uploadOnCloudinary(avatarLocalPath, avatarFileName);

    if (!avatarUpload) {
        throw new ApiError(400, "Failed to upload avatar. Please try again");
    }

    // Handle cover image upload (optional)
    let coverImageUrl = "";
    if (coverImage && coverImage[0]) {
        const coverImageLocalPath = coverImage[0].path;
        const coverImageFileName = path.basename(coverImageLocalPath).split('.')[0];
        // Use original filename in the above code for the cover image
        // console.log(coverImageLocalPath, coverImageFileName);
        const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath, coverImageFileName);
        coverImageUrl = coverImageUpload?.url || "";
    }

    // Create user in the database
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullName,
        avatar: avatarUpload.url,
        coverImage: coverImageUrl,
    });

    // Fetch the created user without sensitive information
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating the user. Please try again");
    }

    // console.log("User created successfully", createdUser);
    return res.status(201).json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token generate
    // send cookies

    const { email, username, password } = req.body;
    console.log(email, username, password);

    if (!(username || email)) {
        throw new ApiError(400, "Please provide valid username or email");
    }
    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user)
        throw new ApiError(404, "User with this username or email doesn't exist");

    const isPassMatch = await user.isPasswordCorrect(password);
    if (!isPassMatch)
        throw new ApiError(401, "Incorrect password, please try again");

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, null, "User logged out Successfully!!"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken)
        throw new ApiError(401, "UnAuthorized for this resource");

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user)
            throw new ApiError(401, "Invalid Refresh Token");

        if (incomingRefreshToken !== user?.refreshToken)
            throw new ApiError(401, "Refresh token is not valid or expired");

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

        return res
            .status(200)
            .cookies("accessToken", accessToken, options)
            .cookies("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
})

export { loginUser, logoutUser, refreshAccessToken, registerUser };

