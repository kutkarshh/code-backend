import { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if (!name && !description)
        throw new ApiError(400, "Name and description are required")

    const playlist = await Playlist.create({ name, description, owner: req.user._id });

    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) throw new ApiError(400, "User ID is Invalid");
    const playlists = await Playlist.find({ owner: userId });

    return res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Playlist ID is Invalid");

    const playlist = await Playlist.findById(playlistId);

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) throw new ApiError(400, "Playlist ID or Video ID is Invalid")

    const playlist = await Playlist.findByIdAndUpdate(playlistId, { $push: { videos: videoId } }, { new: true });

    if (!playlist)
        throw new ApiError(404, "Playlist Not Found")

    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) throw new ApiError(400, "Playlist ID or Video ID is Invalid")

    const playlist = await Playlist.findByIdAndUpdate(playlistId, { $pull: { videos: videoId } }, { new: true });

    if (!playlist)
        throw new ApiError(404, "Playlist Not Found")

    return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Playlist ID is Invalid")

    await Playlist.findByIdAndDelete({ _id: playlistId });

    return res.status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Playlist ID is Invalid")

    const updatedPlaylist = await Playlist.findByIdAndUpdate({ _id: playlistId }, { name, description }, { new: true });

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));
})

export {
    addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist
}
