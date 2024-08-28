import { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = 1, userId } = req.query

    if (userId)
        match

    if (!query)
        throw new ApiError(404, "Results not Found!");

    try {
        var videoAggregate = Video.aggregate(
            [{
                $match:
                {
                    $or: [
                        { title: { $regex: query, $options: i } },
                        { description: { $regex: query, $options: i } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                avatar: "$avatar.url",
                                username: 1
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
            },
            {
                $sort: {
                    [sortBy]: sortType || 1
                }
            }]
        )
    } catch (error) {
        throw new ApiError(500, error.message || "Internal Server Error in Video Aggregator");
    }

    const options = {
        page,
        limit,
        customLabel: {
            totalDocs: "totalVideos",
            docs: "videos",
        },
        skip: (page - 1) * limit,
        limit: parseInt(limit),
    }

    Video.aggregatePaginate(videoAggregate, options)
        .then(result => {
            if (result?.videos?.length === 0 && userId) {
                return res.status(200).json(new ApiResponse(200, [], "No Videos Found"));
            }

            return res.status(200).json(new ApiResponse(200, result, "Vidoes Fetched Successfully!"));
        })
        .catch(error => {
            throw new ApiError(500, error?.message || "Internal Server Error in Video Aggregator Paginate");
        })
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!(title && description)) {
        throw new ApiError(400, "Please provide title and description")
    }

    // console.log(req.files)
    const videoLocalPath = req.files?.videoFile[0]?.path

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path


    if (!videoLocalPath && !thumbnailLocalPath) {
        throw new ApiError(400, "Please provide video and thumbnail")
    }

    const video = await uploadOnCloudinary(videoLocalPath);

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);


    const videoPublished = await Video.create({
        title,
        description,
        videoFile: {
            url: video.secure_url,
            public_id: video.public_id
        },
        thumbnail: {
            url: thumbnail.secure_url,
            public_id: thumbnail.public_id
        },
        duration: video.duration,
        owner: req.user._id
    })

    return res.status(201)
        .json(new ApiResponse(200, videoPublished, "Video Published Successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res.status(200)
        .json(new ApiResponse(200, video, "Video Feched Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const UpdatedVideoData = {
        title: req.body.title,
        description: req.body.description,
    };

    const video = await Video.findById(videoId);

    if (req.file.path !== "") {
        await destroyCloudImage(video.thumbnail.public_id)
    }

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file is missing")
    }

    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnailUpload.url) {
        throw new ApiError(400, "Error while uloading thumbnail")
    }

    UpdatedVideoData.thumbnail = {
        public_id: thumbnailUpload.public_id,
        url: thumbnailUpload.secure_url
    }

    const updateVideoDetails = await Video.findByIdAndUpdate(videoId, UpdatedVideoData, {
        new: true,
    });

    return res.status(200)
        .json(new ApiResponse(200, updateVideoDetails, "Video Details Updated Successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId);

    await destroyCloudImage(video.thumbnail.public_id)

    await destroyCloudVideo(video.videoFile.public_id)

    await Video.findByIdAndDelete(videoId)

    return res.status(200)
        .json(new ApiResponse(200, {}, "Video Deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    // Toggle the isPublish field
    video.isPublished = !video.isPublished;

    // Save the updated video
    await video.save();

    return res.status(200)
        .json(new ApiResponse(200, video, "isPublished toggle Successfully"))
})

export {
    deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo
}
