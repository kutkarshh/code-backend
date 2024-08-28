import { Router } from "express";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { validateCommentId, validateVideoId } from "../middlewares/mongooseValidation.middleware";

const route = Router();

route.get("/:videoId", validateVideoId, verifyJWT, getVideoComments);

route.post("/:videoId", validateVideoId, verifyJWT, addComment);

route.patch("/:commentId", validateCommentId, verifyJWT, updateComment);

route.delete("/:commentId", validateCommentId, verifyJWT, deleteComment);

export default route;