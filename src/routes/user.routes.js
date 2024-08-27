import { Router } from "express";
import {
    changeCurrentPassword,
    getCurrentUser,
    getSubscribeData,
    getUserWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateUserAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
    ,
    registerUser);

router.route("/login").post(loginUser);

// Secured Routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refreshToken").post(refreshAccessToken);
router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
// Get Current User
router.route("/getUser").get(verifyJWT, getCurrentUser);
// Update User Details
router.route("/updateProfile").patch(verifyJWT, updateUserAccountDetails);

// Uploading and Updating Avatar and Cover Image
router.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/updateCoverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// Get User Subscriptions and Subscribers Data
router.route("/c/:username").get(verifyJWT, getSubscribeData);

// Get User Watch History Data
router.route("/history").get(verifyJWT, getUserWatchHistory);

export default router;