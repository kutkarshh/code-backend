import Joi from "joi";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const commentSchema = Joi.object().keys({
    content: Joi.string().required(),
});

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skipComments = (page - 1) * limit;

    const comments = await Comment.find({ video: videoId })
        .skip(skipComments)
        .limit(limit)
        .populate("owner")
        .sort({ createdAt: -1 })
        .lean();

    if (!comments)
        throw new ApiError(404, "Comments not found");

    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const user = req.user;

    const { error } = commentSchema.validate({ content });
    if (error)
        throw new ApiError(400, "Comment is required");

    const newComment = await Comment.create({ video: videoId, content, owner: user._id }).lean();

    return res.status(201).json(new ApiResponse(201, newComment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    const { error } = commentSchema.validate({ content });
    if (error)
        throw new ApiError(400, "Comment is required");

    const updatedComment = await Comment.findByIdAndUpdate({ _id: commentId }, { $set: { content } }, { new: true, lean: true });

    if (!updatedComment)
        throw new ApiError(404, "Comment not found or Invalid Comment ID");

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    await Comment.findByIdAndDelete({ _id: commentId }, { lean: true });

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { addComment, deleteComment, getVideoComments, updateComment };
