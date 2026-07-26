import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = new mongoose.Types.ObjectId(req.user?._id)

    const [videoStats, totalSubscribers, totalLikes] = await Promise.all([
        Video.aggregate([
            {
                $match: {
                    owner: channelId
                }
            },
            {
                $group: {
                    _id: null,
                    totalViews: {$sum: "$views"},
                    totalVideos: {$sum: 1}
                }
            }
        ]),
        Subscription.countDocuments({channel: channelId}),
        Like.countDocuments({
            video: {
                $in: await Video.find({owner: channelId}).distinct("_id")
            }
        })
    ])

    const stats = {
        totalViews: videoStats[0]?.totalViews || 0,
        totalSubscribers,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalLikes
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({owner: req.user?._id})
        .sort({createdAt: -1})

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }
