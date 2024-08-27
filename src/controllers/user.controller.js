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

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!(newPassword === confirmPassword))
        throw new ApiError(400, "Passwords don't match");

    const user = User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) throw new ApiError(400, "Old password is incorrect");
    user.password = newPassword;
    await user.save();
    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
})

const updateUserAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email)
        throw new ApiError(400, "Please provide valid details");

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {
            new: true  // returns updated user
        }
    ).select("-password -refreshToken");  // returns updated user without password and refreshToken
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath)
        throw new ApiError(400, "Please provide Avatar image");

    // delete old avatar from cloudinary server
    await deleteOnCloudinary(path.basename(req.user?.avatar));

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) throw new ApiError(500, "Failed to upload avatar");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                avatar: avatar.url
            }
        },
        { new: true })
        .select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath)
        throw new ApiError(400, "Please provide Cover image");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) throw new ApiError(500, "Failed to upload Cover image");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                coverImage: coverImage.url
            }
        },
        { new: true })
        .select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
})

// Get subscribers and subscribedTo count of a user

const getSubscribeData = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim())
        throw new ApiError(400, "Please provide valid username");

    const channel = await User.aggregate([{
        $match: {
            username: username?.toLowerCase()
        }
    }, {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers",
        }
    }, {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo",
        }
    },
    {
        $addFields: {
            subscribersCount: {
                $size: "$subscribers"
            },
            channelSubscrbedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project: {
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelSubscrbedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1,
        }
    }
    ])

    if (!channel.length)
        throw new ApiError(404, "Channel Does not exist");

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "Subscribers fetched successfully")
        );
})

// Get User Watched History
const getUserWatchHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId)
        throw new ApiError(400, "User not logged in");

    const user = User.aggregate([{
        $match: {
            _id: new mongoose.Types.ObjectId(userId),
        }
    },
    {
        $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1,
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        owner: {
                            $first: "$owner",
                        }
                    }
                }
            ]
        }
    }])

    return res
        .status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "Watch History fetched successfully"));
})

export {
    changeCurrentPassword,
    getCurrentUser, getSubscribeData, getUserWatchHistory, loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateUserAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};

