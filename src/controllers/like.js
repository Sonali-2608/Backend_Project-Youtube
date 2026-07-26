import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.exists({_id: videoId})

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)

        return res
            .status(200)
            .json(new ApiResponse(200, {liked: false}, "Video unliked successfully"))
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, {liked: true}, "Video liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.exists({_id: commentId})

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)

        return res
            .status(200)
            .json(new ApiResponse(200, {liked: false}, "Comment unliked successfully"))
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, {liked: true}, "Comment liked successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.exists({_id: tweetId})

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)

        return res
            .status(200)
            .json(new ApiResponse(200, {liked: false}, "Tweet unliked successfully"))
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, {liked: true}, "Tweet liked successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.find({
        likedBy: req.user?._id,
        video: {$exists: true, $ne: null}
    })
        .populate({
            path: "video",
            match: {isPublished: true},
            populate: {
                path: "owner",
                select: "username fullName avatar"
            }
        })
        .sort({createdAt: -1})

    const videos = likedVideos
        .map((like) => like.video)
        .filter(Boolean)

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
