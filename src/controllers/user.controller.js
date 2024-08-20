import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncDBHandler } from "../utils/asyncDBHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { User } from "../models/user.model.js";

const registerUser = asyncDBHandler(async (req, res) => {
    // get user details from the frontend
    // Validate user details - not empty
    // check if user already exists: username or email
    // check for images, and avatar provided or not
    // upload image on cloudinary and get the url
    // hash the password using bcrypt
    // generate access token
    // create user object - create entry in DB
    // remove password and refresh token from user object
    // check if user created successfully or not
    // return response to frontend

    const { username, email, password, fullName } = req.body;

    if ([username, email, password, fullName].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Please fill all required fields");
    }

    const existedUser = User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User with this username or email already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide an avatar image");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar. Please try again");
    }
    // Creating the user object
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
    })

    const createdUser = User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user. Please try again");
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User created successfully"));
});

export { registerUser };
