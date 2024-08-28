import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const validateVideoId = (req, res, next) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId))
        throw new ApiError(400, "Video ID is Invalid");

    next();
};

const validateCommentId = (req, res, next) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId))
        throw new ApiError(400, "Comment ID is Invalid");

    next();
};

export { validateCommentId, validateVideoId };
