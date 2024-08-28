import { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId) throw new ApiError(400, "Channel ID is Invalid")

    const subscribedCheck = await Subscription.findOne({ subscriber: req.user?._id, channel: channelId })

    if (subscribedCheck) {
        await subscribedCheck.deleteOne()
        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed Successfully!"))
    }

    const subscribeChannel = await Subscription.create({ subscriber: req.user?._id, channel: channelId })

    return res.status(201).json(new ApiResponse(201, subscribeChannel, "Subscribed Successfully!"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) throw new ApiError(400, "Channel ID is Invalid")

    const subscribers = await Subscription.find({ channelId }).populate("subscriber", "fullName email username avatar coverImage");

    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) throw new ApiError(400, "Subscriber ID is Invalid")

    const channels = await Subscription.find({ subscriber: subscriberId }).populate("channel", "fullName username avatar coverImage");

    return res.status(200).json(new ApiResponse(200, channels, "Channels fetched successfully"));
})

export {
    getSubscribedChannels, getUserChannelSubscribers, toggleSubscription
}
