import path from 'path';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncDBHandler } from '../utils/asyncDBHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const registerUser = asyncDBHandler(async (req, res) => {
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

export { registerUser };
