import { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId))
        throw new ApiError(400, "Video ID is Invalid")
    const like = await Like.findOne({ video: videoId, likedBy: req.user._id });

    if (like) {
        await like.deleteOne();
        return res.status(200)
            .json(new ApiResponse(200, {}, "Like Removed successfully"));
    }

    const likedVideo = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res.status(201)
        .json(new ApiResponse(201, likedVideo, "Like Added Successfully"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Comment ID is Invalid");

    const like = await Like.findOne({ comment: commentId, likedBy: req.user._id });
    if (like) {
        await like.deleteOne();
        return res.status(200)
            .json(new ApiResponse(200, {}, "Like Removed successfully"));
    }

    const likedComment = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, likedComment, "Like Added Successfully"));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Tweet ID is Invalid");

    const like = await Like.findOne({ tweet: twwetId, likedBy: req.user._id });
    if (like) {
        await like.deleteOne();
        return res.status(200)
            .json(new ApiResponse(200, {}, "Like Removed successfully"));
    }

    const likeTweet = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, likeTweet, "Like Added Successfully"));
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.findOne({ likedBy: req.user?._id, video: { $ne: null } }).populate("video");

    const likedVideos = likes.filter(like => like.video).map(like => like.video);

    if (likedVideos.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No liked videos found"));
    }

    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
})

export {
    getLikedVideos, toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike
}
